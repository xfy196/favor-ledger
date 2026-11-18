"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { members, records } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { requireFamilyContext } from "@/lib/session";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function listMembers() {
  const { db, familyId } = await requireFamilyContext();
  const rows = await db.query.members.findMany({
    where: eq(members.familyId, familyId),
  });
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function addMember(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "成员名不能为空" };

  const { db, familyId } = await requireFamilyContext();
  const existing = await db.query.members.findFirst({
    where: and(eq(members.familyId, familyId), eq(members.name, trimmed)),
  });
  if (existing) return { ok: false, error: "该成员已存在" };

  await db.insert(members).values({
    id: createId("mem"),
    familyId,
    name: trimmed,
    createdAt: Date.now(),
  });

  revalidatePath("/");
  revalidatePath("/data");
  return { ok: true };
}

export async function removeMember(
  id: string,
): Promise<ActionResult<{ referencedCount: number }>> {
  const { db, familyId } = await requireFamilyContext();
  const member = await db.query.members.findFirst({
    where: and(eq(members.id, id), eq(members.familyId, familyId)),
  });
  if (!member) return { ok: false, error: "成员不存在" };

  const referenced = await db
    .select({ count: sql<number>`count(*)` })
    .from(records)
    .where(
      and(eq(records.familyId, familyId), eq(records.member, member.name)),
    );
  const referencedCount = Number(referenced[0]?.count ?? 0);

  await db
    .delete(members)
    .where(and(eq(members.id, id), eq(members.familyId, familyId)));

  revalidatePath("/");
  revalidatePath("/data");
  return { ok: true, data: { referencedCount } };
}
