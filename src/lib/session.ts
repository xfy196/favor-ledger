import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession as getAuthSession } from "./auth";
import { getDb } from "./db";
import { ensureFamilyForUser, getFamilyIdForUser } from "./family";

export const getSession = cache(async () => getAuthSession());

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireFamilyContext() {
  const user = await requireUser();
  const db = await getDb();
  let familyId = await getFamilyIdForUser(db, user.id);
  if (!familyId) {
    familyId = await ensureFamilyForUser(db, user.id);
  }
  return { user, db, familyId };
}
