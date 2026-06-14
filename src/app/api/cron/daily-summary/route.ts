import { runDailySummary } from "@/lib/daily-summary-job";
import { isValidDateKey } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily summary email job. Triggered by Vercel Cron at 16:30 UTC (22:00 IST).
 * Secured by CRON_SECRET — accepts either:
 *   Authorization: Bearer <CRON_SECRET>   (Vercel Cron sends this)
 *   ?secret=<CRON_SECRET>                 (manual trigger)
 */
async function handle(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const auth = req.headers.get("authorization");
  const provided = auth?.startsWith("Bearer ")
    ? auth.slice(7)
    : url.searchParams.get("secret");

  if (provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional ?date=YYYY-MM-DD override (for backfills / testing).
  const dateParam = url.searchParams.get("date");
  const dateKey = dateParam && isValidDateKey(dateParam) ? dateParam : undefined;

  const result = await runDailySummary(dateKey);
  return Response.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
