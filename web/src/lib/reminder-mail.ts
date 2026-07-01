function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

export interface ReminderMailInput {
  vendorName: string;
  dueDate: string; // already formatted for display
  overdue: boolean;
  days: number; // signed days until due (negative = overdue)
  loginUrl: string;
}

export function reminderEmail({ vendorName, dueDate, overdue, days, loginUrl }: ReminderMailInput) {
  const abs = Math.abs(days);
  const status = overdue ? `overdue by ${abs} day${abs === 1 ? "" : "s"}` : `due in ${abs} day${abs === 1 ? "" : "s"}`;
  const subject = `TPRM assessment ${overdue ? "overdue" : "due soon"} — ${vendorName}`;
  const text = `Hello,

This is a reminder that the third-party risk assessment for ${vendorName} is ${status} (due ${dueDate}).

Please log in to complete or update your submission: ${loginUrl}

Thank you,
TPRM Team`;
  const html = `<p>Hello,</p>
<p>This is a reminder that the third-party risk assessment for <b>${esc(vendorName)}</b> is <b>${esc(status)}</b> (due ${esc(dueDate)}).</p>
<p>Please <a href="${esc(loginUrl)}">log in</a> to complete or update your submission.</p>
<p>Thank you,<br/>TPRM Team</p>`;
  return { subject, text, html };
}
