"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { members, records } from "@/lib/db/schema";
import { requireFamilyContext } from "@/lib/session";

export type ExportPayload = {
  version: 1;
  exportedAt: number;
  members: Array<{ id: string; name: string; createdAt: number }>;
  records: Array<{
    id: string;
    person: string;
    direction: "in" | "out";
    amountCents: number;
    occasion: string | null;
    date: string;
    member: string;
    note: string | null;
    targetId: string | null;
    createdAt: number;
  }>;
};

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function exportJson(): Promise<ActionResult<ExportPayload>> {
  const { db, familyId } = await requireFamilyContext();
  const memberRows = await db.query.members.findMany({
    where: eq(members.familyId, familyId),
  });
  const recordRows = await db.query.records.findMany({
    where: eq(records.familyId, familyId),
  });

  return {
    ok: true,
    data: {
      version: 1,
      exportedAt: Date.now(),
      members: memberRows.map((m) => ({
        id: m.id,
        name: m.name,
        createdAt: m.createdAt,
      })),
      records: recordRows.map((r) => ({
        id: r.id,
        person: r.person,
        direction: r.direction,
        amountCents: r.amountCents,
        occasion: r.occasion,
        date: r.date,
        member: r.member,
        note: r.note,
        targetId: r.targetId,
        createdAt: r.createdAt,
      })),
    },
  };
}

export async function clearLedger(): Promise<ActionResult> {
  const { db, familyId } = await requireFamilyContext();
  await db.delete(records).where(eq(records.familyId, familyId));
  revalidatePath("/");
  revalidatePath("/relations");
  revalidatePath("/data");
  return { ok: true };
}

export async function importJson(
  payload: unknown,
): Promise<ActionResult<{ imported: number; skipped: number; warnings: string[] }>> {
  try {
    const { db, familyId } = await requireFamilyContext();
    if (!payload || typeof payload !== "object") {
      return { ok: false, error: "无效的 JSON" };
    }

    const data = payload as Partial<ExportPayload>;
    if (!Array.isArray(data.records)) {
      return { ok: false, error: "JSON 缺少 records" };
    }

    const warnings: string[] = [];
    const existing = await db.query.records.findMany({
      where: eq(records.familyId, familyId),
    });
    const existingIds = new Set(existing.map((r) => r.id));
    const existingMembers = await db.query.members.findMany({
      where: eq(members.familyId, familyId),
    });
    const memberNames = new Set(existingMembers.map((m) => m.name));

    if (Array.isArray(data.members)) {
      for (const m of data.members) {
        if (!m?.id || !m?.name) continue;
        if (memberNames.has(m.name)) continue;
        const idExists = existingMembers.some((x) => x.id === m.id);
        await db.insert(members).values({
          id: idExists ? crypto.randomUUID() : m.id,
          familyId,
          name: m.name,
          createdAt: m.createdAt || Date.now(),
        });
        memberNames.add(m.name);
      }
    }

    let imported = 0;
    let skipped = 0;
    const incomingIds = new Set(
      data.records.filter((r) => r?.id).map((r) => r.id),
    );

    for (const r of data.records) {
      if (!r?.id || !r.person || !r.direction || !r.date || !r.member) {
        warnings.push("跳过格式不完整的记录");
        continue;
      }
      if (r.direction !== "in" && r.direction !== "out") {
        warnings.push(`跳过方向非法的记录 ${r.id}`);
        continue;
      }
      if (!Number.isInteger(r.amountCents) || r.amountCents <= 0) {
        warnings.push(`跳过金额非法的记录 ${r.id}`);
        continue;
      }
      if (existingIds.has(r.id)) {
        skipped += 1;
        continue;
      }

      let targetId = r.targetId ?? null;
      if (targetId) {
        const targetExists =
          existingIds.has(targetId) || incomingIds.has(targetId);
        if (!targetExists) {
          warnings.push(`记录 ${r.id} 的配对目标不存在，已按未配对导入`);
          targetId = null;
        }
      }
      if (r.direction === "in") {
        targetId = null;
      }

      await db.insert(records).values({
        id: r.id,
        familyId,
        person: r.person,
        direction: r.direction,
        amountCents: r.amountCents,
        occasion: r.occasion ?? null,
        date: r.date,
        member: r.member,
        note: r.note ?? null,
        targetId,
        createdAt: r.createdAt || Date.now(),
      });
      existingIds.add(r.id);
      imported += 1;
    }

    // Second pass: clear dangling targets among newly imported if target missing
    const all = await db.query.records.findMany({
      where: eq(records.familyId, familyId),
    });
    const ids = new Set(all.map((r) => r.id));
    for (const r of all) {
      if (r.targetId && !ids.has(r.targetId)) {
        await db
          .update(records)
          .set({ targetId: null })
          .where(eq(records.id, r.id));
        warnings.push(`记录 ${r.id} 配对悬空，已解除`);
      }
    }

    revalidatePath("/");
    revalidatePath("/relations");
    revalidatePath("/data");
    return { ok: true, data: { imported, skipped, warnings } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "导入失败",
    };
  }
}
