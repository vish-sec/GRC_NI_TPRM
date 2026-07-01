import nodemailer from "nodemailer";
import { getSettings } from "./settings";

// Mirrors the adjudicator's "safe degrade, never throw" pattern: no SMTP
// configured (or a send failure) returns a result instead of throwing, so a
// reminder attempt can never crash the calling route.
export interface MailResult {
  sent: boolean;
  reason?: "not_configured" | "send_failed";
  error?: string;
}

export async function sendMail(to: string[], subject: string, html: string, text: string): Promise<MailResult> {
  const s = getSettings();
  if (s.email.provider !== "smtp" || !s.email.smtp.host || to.length === 0) {
    return { sent: false, reason: "not_configured" };
  }
  try {
    const transport = nodemailer.createTransport({
      host: s.email.smtp.host,
      port: s.email.smtp.port,
      secure: s.email.smtp.secure,
      auth: s.email.smtp.user ? { user: s.email.smtp.user, pass: s.email.smtp.pass } : undefined,
    });
    const from = s.email.fromName
      ? `"${s.email.fromName.replace(/"/g, "")}" <${s.email.fromAddress || s.email.smtp.user}>`
      : s.email.fromAddress || s.email.smtp.user;
    await transport.sendMail({ from, to, subject, html, text });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: "send_failed", error: e instanceof Error ? e.message : String(e) };
  }
}
