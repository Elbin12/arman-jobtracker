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

const SURCHARGE_KEYS = ["total_surcharge", "total_surcharges", "trip_surcharge"];

/**
 * Merge a list/snapshot job with GET-job detail. Detail responses sometimes omit or null
 * surcharge fields while the list payload has them — avoid clobbering valid values with null/"".
 */
export function overlayJobDetail(listJob, detailJob) {
  if (!listJob) return null;
  if (!detailJob) return listJob;
  const merged = { ...listJob, ...detailJob };
  for (const key of SURCHARGE_KEYS) {
    const fromDetail = detailJob[key];
    if (fromDetail == null || fromDetail === "") {
      const fromList = listJob[key];
      if (fromList != null && fromList !== "") merged[key] = fromList;
    }
  }
  return merged;
}
