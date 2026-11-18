import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDb = ReturnType<typeof drizzle<typeof schema>>;

export const getDb = cache(async (): Promise<AppDb> => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
});
