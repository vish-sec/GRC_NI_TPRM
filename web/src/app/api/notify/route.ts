import { NextRequest, NextResponse } from "next/server";
import { currentSession, can } from "@/lib/auth";
import { customerList } from "@/lib/portfolio";
import { listVendorContacts } from "@/lib/users";
import { sendMail } from "@/lib/mailer";
import { reminderEmail } from "@/lib/reminder-mail";
import { audit } from "@/lib/audit";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";

// Root and Customer may email a vendor's contacts that its TPRM assessment is
// upcoming or overdue. Uses the same nextDueAt/overdue calc that already
// drives the in-app portfolio badges — see src/lib/portfolio.ts.
export async function POST(req: NextRequest) {
  const s = await currentSession();
  if (!can(s?.role, "notify:send")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = await readJson<{ vendorId?: string }>(req);
  if ("error" in parsed) return parsed.error;
  const vendorId = String(parsed.data.vendorId || "");
  const row = customerList().find((v) => v.vendorId === vendorId);
  if (!row) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  const contacts = listVendorContacts(vendorId);
  const recipients = contacts.map((c) => c.username);
  if (recipients.length === 0) {
    audit(s!.username, "TPRM reminder skipped — no vendor contacts", vendorId);
    return NextResponse.json({ sent: false, reason: "no_contacts", recipients: [] });
  }

  const days = Math.round((Date.parse(row.nextDueAt) - Date.now()) / 86_400_000);
  const { subject, text, html } = reminderEmail({
    vendorName: row.name,
    dueDate: new Date(row.nextDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    overdue: row.overdue,
    days,
    loginUrl: `${req.nextUrl.origin}/login`,
  });

  const result = await sendMail(recipients, subject, html, text);
  audit(
    s!.username,
    result.sent ? "sent TPRM reminder" : "TPRM reminder not delivered",
    `${vendorId} · ${recipients.length} recipient(s)${result.sent ? "" : ` · ${result.reason}`}`
  );
  return NextResponse.json({ ...result, recipients });
}
