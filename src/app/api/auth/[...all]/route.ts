import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

async function handler(request: Request) {
  const auth = await getAuth();
  const { GET, POST } = toNextJsHandler(auth);
  if (request.method === "GET") return GET(request);
  return POST(request);
}

export const GET = handler;
export const POST = handler;
