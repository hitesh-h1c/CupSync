import { dbConnect } from "@/lib/db";
import { Office } from "@/models/Office";
import { Vendor } from "@/models/Vendor";
import { DailyEmailLog } from "@/models/DailyEmailLog";
import { getOfficeDaySummary, type SummaryLine } from "@/lib/delivery-summary";
import { getVendorSubscriptionState } from "@/lib/subscription";
import { sendMail } from "@/lib/email";
import { istDateKey, formatDateKey } from "@/lib/date";
import { formatINR } from "@/lib/money";

export interface JobResult {
  dateKey: string;
  processed: number;
  sent: number;
  previewed: number;
  failed: number;
  alreadySent: number;
}

function renderEmail(
  business: string,
  officeName: string,
  dateKey: string,
  lines: SummaryLine[],
  total: number
): { subject: string; html: string; text: string } {
  const dateLabel = formatDateKey(dateKey);
  const subject = `Your Cup Sync summary — ${dateLabel}`;

  const rowsHtml = lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0">${l.name}</td><td style="text-align:right">${l.quantity}</td><td style="text-align:right">${formatINR(l.unitPrice)}</td><td style="text-align:right">${formatINR(l.lineTotal)}</td></tr>`
    )
    .join("");

  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#1C1917;max-width:520px">
    <h2 style="color:#B45309;margin:0 0 4px">Cup Sync</h2>
    <p style="color:#78716C;margin:0 0 16px">${business}</p>
    <p>Hello ${officeName},</p>
    <p>Here's your delivery summary for <strong>${dateLabel}</strong>:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="color:#78716C;text-align:left;border-bottom:1px solid #E7E5E4">
        <th style="padding:6px 0">Item</th><th style="text-align:right">Qty</th>
        <th style="text-align:right">Rate</th><th style="text-align:right">Amount</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot><tr style="border-top:1px solid #E7E5E4;font-weight:bold">
        <td style="padding:8px 0">Total</td><td></td><td></td>
        <td style="text-align:right">${formatINR(total)}</td>
      </tr></tfoot>
    </table>
    <p style="color:#78716C;font-size:12px;margin-top:20px">
      Sent automatically by Cup Sync. Log in to see your full history.
    </p>
  </div>`;

  const text =
    `Cup Sync — ${business}\nSummary for ${officeName}, ${dateLabel}:\n\n` +
    lines.map((l) => `  ${l.name}: ${l.quantity} × ${formatINR(l.unitPrice)} = ${formatINR(l.lineTotal)}`).join("\n") +
    `\n\nTotal: ${formatINR(total)}\n`;

  return { subject, html, text };
}

/**
 * Send each eligible office its summary for `dateKey` (default: today IST).
 * Skips offices whose vendor's subscription has expired, offices with the daily
 * email disabled or no contact email, and offices already emailed for the day.
 */
export async function runDailySummary(dateKey?: string): Promise<JobResult> {
  await dbConnect();
  const day = dateKey ?? istDateKey();

  const offices = await Office.find({
    active: true,
    dailyEmailEnabled: true,
    contactEmail: { $nin: [null, ""] },
  })
    .select("name contactEmail vendor")
    .lean();

  // Which vendors are allowed to send (not expired)?
  const vendorIds = [...new Set(offices.map((o) => String(o.vendor)))];
  const allowed = new Set<string>();
  const businessNames = new Map<string, string>();
  for (const vid of vendorIds) {
    const state = await getVendorSubscriptionState(vid);
    if (state && !state.readOnly) allowed.add(vid);
    const vendor = await Vendor.findById(vid).select("businessName").lean();
    if (vendor) businessNames.set(vid, vendor.businessName);
  }

  const result: JobResult = {
    dateKey: day,
    processed: 0,
    sent: 0,
    previewed: 0,
    failed: 0,
    alreadySent: 0,
  };

  for (const office of offices) {
    const vid = String(office.vendor);
    if (!allowed.has(vid)) continue; // vendor expired

    const officeId = String(office._id);

    // Idempotency: don't re-send if already sent/previewed today.
    const existing = await DailyEmailLog.findOne({
      office: officeId,
      dateKey: day,
      status: { $in: ["sent", "previewed"] },
    })
      .select("_id")
      .lean();
    if (existing) {
      result.alreadySent++;
      continue;
    }

    const summary = await getOfficeDaySummary(officeId, day);
    if (!summary) continue; // nothing delivered — no email

    result.processed++;
    const { subject, html, text } = renderEmail(
      businessNames.get(vid) ?? "Cup Sync",
      office.name,
      day,
      summary.lines,
      summary.total
    );

    const res = await sendMail({ to: office.contactEmail as string, subject, html, text });

    await DailyEmailLog.create({
      vendor: office.vendor,
      office: office._id,
      dateKey: day,
      sentAt: new Date(),
      status: res.status,
      detail: res.detail,
    });

    if (res.status === "sent") result.sent++;
    else if (res.status === "previewed") result.previewed++;
    else result.failed++;
  }

  return result;
}
