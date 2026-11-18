import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  familyName: text("family_name").notNull().default(""),
  createdAt: integer("created_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("members_family_name_uidx").on(table.familyId, table.name)],
);

export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  person: text("person").notNull(),
  direction: text("direction", { enum: ["in", "out"] }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  occasion: text("occasion"),
  date: text("date").notNull(),
  member: text("member").notNull(),
  note: text("note"),
  targetId: text("target_id"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  family: one(families, {
    fields: [user.id],
    references: [families.ownerUserId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  owner: one(user, {
    fields: [families.ownerUserId],
    references: [user.id],
  }),
  members: many(members),
  records: many(records),
}));

export const membersRelations = relations(members, ({ one }) => ({
  family: one(families, {
    fields: [members.familyId],
    references: [families.id],
  }),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  family: one(families, {
    fields: [records.familyId],
    references: [families.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  families,
  members,
  records,
};

export type RecordRow = typeof records.$inferSelect;
export type MemberRow = typeof members.$inferSelect;
export type FamilyRow = typeof families.$inferSelect;
