/**
 * Build query params for GET /api/payroll/time-off/available-employees/
 *
 * @param {string | object} input — YYYY-MM-DD string (legacy) or options object
 * @returns {Record<string, string> | null}
 */
export function buildAvailableEmployeesQueryParams(input) {
  if (input == null || input === '') return null;

  if (typeof input === 'string') {
    const date = input.trim();
    return date ? { date } : null;
  }

  const {
    date,
    start_date: startDate,
    end_date: endDate,
    period,
    from_time: fromTime,
    to_time: toTime,
    hour,
    minute,
    ampm,
    duration_hours: durationHours,
  } = input;

  if (startDate && endDate) {
    const params = {
      start_date: String(startDate).trim(),
      end_date: String(endDate).trim(),
    };
    if (period === 'am' || period === 'pm') params.period = period;
    if (fromTime) params.from_time = normalizeApiTime(fromTime);
    if (toTime) params.to_time = normalizeApiTime(toTime);
    return params;
  }

  const day = date?.trim();
  if (!day) return null;

  const params = { date: day };

  if (period === 'am' || period === 'pm') {
    params.period = period;
    return params;
  }

  if (fromTime && toTime) {
    params.from_time = normalizeApiTime(fromTime);
    params.to_time = normalizeApiTime(toTime);
    return params;
  }

  const slot = jobScheduleToTimeSlot(hour, minute, ampm, durationHours);
  if (slot) {
    params.from_time = slot.from_time;
    params.to_time = slot.to_time;
  }

  return params;
}

/** @returns {string} HH:MM for API */
export function normalizeApiTime(value) {
  if (!value) return '';
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

/**
 * Job UI uses 12h clock + duration in hours → API from_time / to_time (HH:MM).
 * @returns {{ from_time: string, to_time: string } | null}
 */
export function jobScheduleToTimeSlot(hour, minute, ampm, durationHours) {
  if (hour == null || hour === '' || minute == null || minute === '' || !ampm) {
    return null;
  }

  let h = parseInt(String(hour), 10);
  if (!Number.isFinite(h) || h < 1 || h > 12) return null;

  const m = parseInt(String(minute), 10);
  if (!Number.isFinite(m) || m < 0 || m > 59) return null;

  const period = String(ampm).toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  const fromMinutes = h * 60 + m;
  const durationMins = Math.max(
    30,
    Math.round((Number(durationHours) > 0 ? Number(durationHours) : 2) * 60)
  );
  const toMinutes = Math.min(24 * 60 - 1, fromMinutes + durationMins);

  return {
    from_time: formatMinutesAsTime(fromMinutes),
    to_time: formatMinutesAsTime(toMinutes),
  };
}

function formatMinutesAsTime(totalMinutes) {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Human-readable label for what availability check is using. */
export function describeAvailabilityWindow(params) {
  if (!params) return '';
  if (params.period === 'am') return 'morning (AM)';
  if (params.period === 'pm') return 'afternoon (PM)';
  if (params.from_time && params.to_time) {
    return `${params.from_time}–${params.to_time}`;
  }
  if (params.start_date && params.end_date && params.start_date !== params.end_date) {
    return `${params.start_date} – ${params.end_date} (full days)`;
  }
  return 'full day';
}
