import { Resend } from "resend";

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  html: string;
  apiKey?: string;
  from?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = input.apiKey ?? process.env.RESEND_API_KEY;
  const from =
    input.from ??
    process.env.EMAIL_FROM ??
    "人情记账簿 <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing; skip send:", input.subject);
    return { ok: true, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "发送邮件失败",
    };
  }
}
