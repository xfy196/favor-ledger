"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  sortRecords,
  type RecordWithMeta,
} from "@/lib/domain/aggregate";
import { parseAmountInput } from "@/lib/domain/money";
import {
  listPendingInForPerson,
  pairingErrorMessage,
  validatePairing,
} from "@/lib/domain/pairing";
import {
  resolveRecordStatus,
  statusLabel,
  type RecordLike,
} from "@/lib/domain/status";
import { records } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { requireFamilyContext } from "@/lib/session";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function toMeta(row: typeof records.$inferSelect): RecordWithMeta {
  return {
    id: row.id,
    person: row.person,
    direction: row.direction,
    amountCents: row.amountCents,
    occasion: row.occasion,
    date: row.date,
    member: row.member,
    note: row.note,
    targetId: row.targetId,
    createdAt: row.createdAt,
  };
}

function toLike(row: RecordWithMeta): RecordLike {
  return {
    id: row.id,
    person: row.person,
    direction: row.direction,
    amountCents: row.amountCents,
    targetId: row.targetId,
  };
}

export type RecordView = RecordWithMeta & {
  status: string;
  statusLabel: string;
  diffCents: number | null;
  pairSummary: string | null;
};

export async function listRecords(filterPerson?: string): Promise<RecordView[]> {
  const { db, familyId } = await requireFamilyContext();
  const rows = await db.query.records.findMany({
    where: eq(records.familyId, familyId),
  });
  let metas = sortRecords(rows.map(toMeta));
  if (filterPerson) {
    metas = metas.filter((r) => r.person === filterPerson);
  }
  const likes = metas.map(toLike);

  return metas.map((r) => {
    const resolved = resolveRecordStatus(r, likes);
    let pairSummary: string | null = null;
    if (r.direction === "out" && r.targetId) {
      const target = metas.find((x) => x.id === r.targetId);
      if (target) {
        pairSummary = `配对：${target.occasion || target.person} ${target.amountCents / 100}，${statusLabel(resolved.status, resolved.diffCents)}`;
      }
    } else if (r.direction === "in") {
      if (resolved.status === "pending") {
        pairSummary = "待回礼";
      } else if (resolved.pairId) {
        const out = metas.find((x) => x.id === resolved.pairId);
        if (out) {
          pairSummary = `已配对（回 ${out.amountCents / 100}，${statusLabel(resolved.status, resolved.diffCents)}）`;
        }
      }
    }

    return {
      ...r,
      status: resolved.status,
      statusLabel: statusLabel(resolved.status, resolved.diffCents),
      diffCents: resolved.diffCents,
      pairSummary,
    };
  });
}

export async function listPersonNames(): Promise<string[]> {
  const { db, familyId } = await requireFamilyContext();
  const rows = await db.query.records.findMany({
    where: eq(records.familyId, familyId),
    columns: { person: true },
  });
  return [...new Set(rows.map((r) => r.person))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export async function listPendingTargets(person: string, excludeOutId?: string) {
  const { db, familyId } = await requireFamilyContext();
  const rows = await db.query.records.findMany({
    where: eq(records.familyId, familyId),
  });
  const likes = rows.map((r) => toLike(toMeta(r)));
  const pending = listPendingInForPerson(person, likes, excludeOutId);
  return pending.map((p) => {
    const full = rows.find((r) => r.id === p.id)!;
    return {
      id: full.id,
      amountCents: full.amountCents,
      occasion: full.occasion,
      date: full.date,
      member: full.member,
    };
  });
}

export async function createRecord(input: {
  person: string;
  direction: "in" | "out";
  amount: string;
  occasion?: string;
  date: string;
  member: string;
  note?: string;
  targetId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, familyId } = await requireFamilyContext();
    const person = input.person.trim();
    if (!person) return { ok: false, error: "姓名不能为空" };
    if (!input.date) return { ok: false, error: "日期不能为空" };
    if (!input.member.trim()) return { ok: false, error: "经手成员不能为空" };

    const amountCents = parseAmountInput(input.amount);
    const existing = await db.query.records.findMany({
      where: eq(records.familyId, familyId),
    });
    const likes = existing.map((r) => toLike(toMeta(r)));

    let targetId: string | null = null;
    if (input.direction === "out") {
      const validation = validatePairing({
        outRecord: { direction: "out", person },
        targetId: input.targetId ?? null,
        all: likes,
      });
      if (!validation.ok) {
        return { ok: false, error: pairingErrorMessage(validation.error) };
      }
      targetId = validation.targetId;
    }

    const id = createId("rec");
    await db.insert(records).values({
      id,
      familyId,
      person,
      direction: input.direction,
      amountCents,
      occasion: input.occasion?.trim() || null,
      date: input.date,
      member: input.member.trim(),
      note: input.note?.trim() || null,
      targetId,
      createdAt: Date.now(),
    });

    revalidatePath("/");
    revalidatePath("/relations");
    return { ok: true, data: { id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "保存失败",
    };
  }
}

export async function updateRecord(input: {
  id: string;
  person: string;
  direction: "in" | "out";
  amount: string;
  occasion?: string;
  date: string;
  member: string;
  note?: string;
  targetId?: string | null;
}): Promise<ActionResult> {
  try {
    const { db, familyId } = await requireFamilyContext();
    const current = await db.query.records.findFirst({
      where: and(eq(records.id, input.id), eq(records.familyId, familyId)),
    });
    if (!current) return { ok: false, error: "记录不存在" };

    const person = input.person.trim();
    if (!person) return { ok: false, error: "姓名不能为空" };
    const amountCents = parseAmountInput(input.amount);

    const existing = await db.query.records.findMany({
      where: eq(records.familyId, familyId),
    });
    const likes = existing.map((r) => toLike(toMeta(r)));

    let targetId: string | null = null;
    if (input.direction === "out") {
      const validation = validatePairing({
        outRecord: { direction: "out", person },
        targetId: input.targetId ?? null,
        all: likes,
        excludeOutId: input.id,
      });
      if (!validation.ok) {
        return { ok: false, error: pairingErrorMessage(validation.error) };
      }
      targetId = validation.targetId;
    }

    // If changing an in record that is paired, keep out pointing to it (allowed).
    await db
      .update(records)
      .set({
        person,
        direction: input.direction,
        amountCents,
        occasion: input.occasion?.trim() || null,
        date: input.date,
        member: input.member.trim(),
        note: input.note?.trim() || null,
        targetId,
      })
      .where(and(eq(records.id, input.id), eq(records.familyId, familyId)));

    revalidatePath("/");
    revalidatePath("/relations");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "更新失败",
    };
  }
}

export async function deleteRecord(id: string): Promise<
  ActionResult<{ unpairedOutIds: string[] }>
> {
  try {
    const { db, familyId } = await requireFamilyContext();
    const current = await db.query.records.findFirst({
      where: and(eq(records.id, id), eq(records.familyId, familyId)),
    });
    if (!current) return { ok: false, error: "记录不存在" };

    const unpairedOutIds: string[] = [];
    if (current.direction === "in") {
      const pairedOuts = await db.query.records.findMany({
        where: and(
          eq(records.familyId, familyId),
          eq(records.targetId, id),
        ),
      });
      for (const out of pairedOuts) {
        unpairedOutIds.push(out.id);
        await db
          .update(records)
          .set({ targetId: null })
          .where(eq(records.id, out.id));
      }
    }

    await db
      .delete(records)
      .where(and(eq(records.id, id), eq(records.familyId, familyId)));

    revalidatePath("/");
    revalidatePath("/relations");
    return { ok: true, data: { unpairedOutIds } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "删除失败",
    };
  }
}

export async function personExists(person: string): Promise<boolean> {
  const names = await listPersonNames();
  return names.includes(person.trim());
}
