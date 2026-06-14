/**
 * Money is stored as a Number of rupees (two-decimal precision) — adequate for
 * the per-cup amounts in this product. Format everything through here.
 */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number): string {
  return inr.format(amount ?? 0);
}

/** Round to 2 decimals to avoid floating-point dust in totals. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
