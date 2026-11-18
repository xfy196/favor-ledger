import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { sendAuthEmail } from "./email";
import { ensureFamilyForUser } from "./family";

function resolveBaseURL(configured?: string) {
  return (
    configured ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function buildTrustedOrigins(baseURL: string) {
  const origins = new Set<string>([
    baseURL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://favor-ledger.xfy196.workers.dev",
  ]);

  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (extra) {
    for (const origin of extra.split(",")) {
      const trimmed = origin.trim().replace(/\/$/, "");
      if (trimmed) origins.add(trimmed);
    }
  }

  return [...origins];
}

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema });

  const envExtra = env as CloudflareEnv & {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_TRUSTED_ORIGINS?: string;
  };

  if (envExtra.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = envExtra.BETTER_AUTH_SECRET;
  }
  if (env.BETTER_AUTH_URL) process.env.BETTER_AUTH_URL = env.BETTER_AUTH_URL;
  if (envExtra.RESEND_API_KEY) process.env.RESEND_API_KEY = envExtra.RESEND_API_KEY;
  if (envExtra.EMAIL_FROM) process.env.EMAIL_FROM = envExtra.EMAIL_FROM;
  if (envExtra.BETTER_AUTH_TRUSTED_ORIGINS) {
    process.env.BETTER_AUTH_TRUSTED_ORIGINS = envExtra.BETTER_AUTH_TRUSTED_ORIGINS;
  }

  const baseURL = resolveBaseURL(env.BETTER_AUTH_URL);

  return betterAuth({
    appName: "人情记账簿",
    baseURL,
    trustedOrigins: buildTrustedOrigins(baseURL),
    secret:
      envExtra.BETTER_AUTH_SECRET ||
      process.env.BETTER_AUTH_SECRET ||
      "dev-secret-favor-ledger-change-me-32chars",
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "重置人情记账簿密码",
          html: `<p>你好 ${user.name || ""}，</p><p>请点击链接重置密码：</p><p><a href="${url}">${url}</a></p>`,
          apiKey: envExtra.RESEND_API_KEY,
          from: envExtra.EMAIL_FROM,
        });
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            await ensureFamilyForUser(db, createdUser.id);
          },
        },
      },
    },
  });
}

export async function getSession() {
  const auth = await getAuth();
  const { headers } = await import("next/headers");
  return auth.api.getSession({ headers: await headers() });
}
