/**
 * Calendar slots may include an offset; quote/job reschedule APIs expect the selected
 * clock time as UTC Z (no zone shift) — same behavior as user quote scheduling.
 */
export function slotWallClockAsUtcIso(isoSlot) {
  if (!isoSlot || typeof isoSlot !== "string") return isoSlot
  const trimmed = isoSlot.trim()
  const withoutMs = trimmed.replace(/\.\d+(?=Z|[+-]|$)/, "")
  const core = withoutMs.replace(/Z$/, "").replace(/[+-]\d{2}:?\d{2}(?::\d{2})?$/, "")
  const m = core.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return isoSlot
  const [, ymd, hh, mm, ss] = m
  return `${ymd}T${hh}:${mm}:${ss}.000Z`
}
