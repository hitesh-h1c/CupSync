import "server-only";
import nodemailer from "nodemailer";

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendResult =
  | { status: "sent"; detail: string }
  | { status: "previewed"; detail: string }
  | { status: "failed"; detail: string };

let cachedTransport: nodemailer.Transporter | null | undefined;

/** Build a transport from SMTP_* env, or null if not configured. */
function getTransport(): nodemailer.Transporter | null {
  if (cachedTransport !== undefined) return cachedTransport;

  const host = process.env.SMTP_HOST;
  if (!host) {
    cachedTransport = null;
    return null;
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return cachedTransport;
}

const FROM = process.env.EMAIL_FROM || "Cup Sync <no-reply@cupsync.app>";

/**
 * Send an email. When SMTP isn't configured (e.g. local dev), this doesn't
 * fail — it logs a preview and reports `previewed`, so the daily-summary job
 * is fully testable without a mail server.
 */
export async function sendMail(input: MailInput): Promise<SendResult> {
  const transport = getTransport();

  if (!transport) {
    console.log(
      `[email:preview] to=${input.to} subject="${input.subject}" (SMTP not configured)`
    );
    return { status: "previewed", detail: `preview → ${input.to}` };
  }

  try {
    const info = await transport.sendMail({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { status: "sent", detail: `messageId ${info.messageId}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { status: "failed", detail: message };
  }
}
