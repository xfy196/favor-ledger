"use server";

import { eq } from "drizzle-orm";
import {
  aggregateByPerson,
  summarizeLedger,
  type LedgerSummary,
  type PersonRelation,
  type RecordWithMeta,
} from "@/lib/domain/aggregate";
import { records } from "@/lib/db/schema";
import { requireFamilyContext } from "@/lib/session";

export async function listRelations(): Promise<{
  relations: PersonRelation[];
  summary: LedgerSummary;
}> {
  const { db, familyId } = await requireFamilyContext();
  const rows = await db.query.records.findMany({
    where: eq(records.familyId, familyId),
  });

  const metas: RecordWithMeta[] = rows.map((row) => ({
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
  }));

  return {
    relations: aggregateByPerson(metas),
    summary: summarizeLedger(metas),
  };
}
