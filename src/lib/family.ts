import { eq } from "drizzle-orm";
import type { AppDb } from "./db";
import { families, members } from "./db/schema";
import { createId } from "./id";

const DEFAULT_MEMBERS = ["我", "配偶"] as const;

export async function ensureFamilyForUser(
  db: AppDb,
  userId: string,
): Promise<string> {
  const existing = await db.query.families.findFirst({
    where: eq(families.ownerUserId, userId),
  });
  if (existing) return existing.id;

  const familyId = createId("fam");
  const now = Date.now();

  await db.insert(families).values({
    id: familyId,
    ownerUserId: userId,
    familyName: "",
    createdAt: now,
  });

  await db.insert(members).values(
    DEFAULT_MEMBERS.map((name) => ({
      id: createId("mem"),
      familyId,
      name,
      createdAt: now,
    })),
  );

  return familyId;
}

export async function getFamilyIdForUser(
  db: AppDb,
  userId: string,
): Promise<string | null> {
  const family = await db.query.families.findFirst({
    where: eq(families.ownerUserId, userId),
  });
  return family?.id ?? null;
}
