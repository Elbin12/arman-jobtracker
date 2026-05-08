/**
 * Job API returns base `total_price` and optional surcharge fields; admin UI shows the combined grand total.
 * Some payloads use `total_surcharge`, others `total_surcharges` (quotes / legacy).
 */
export function jobSurchargeAmount(job) {
  if (!job || typeof job !== "object") return 0;
  const candidates = [
    job.total_surcharge,
    job.total_surcharges,
    job.trip_surcharge,
  ];
  for (const v of candidates) {
    if (v == null || v === "") continue;
    const n = typeof v === "number" ? v : parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function jobGrandTotalAmount(job) {
  if (!job) return 0;
  const base = parseFloat(job.total_price);
  const baseAmt = Number.isFinite(base) ? base : 0;
  return baseAmt + jobSurchargeAmount(job);
}
