/** API coverage values for payroll time-off */
export const COVERAGE_FULL_DAY = 'full_day';
export const COVERAGE_HALF_AM = 'half_day_am';
export const COVERAGE_HALF_PM = 'half_day_pm';
export const COVERAGE_CUSTOM = 'custom';

export const COVERAGE_OPTIONS = [
  { value: COVERAGE_FULL_DAY, label: 'Full day', description: 'Entire workday' },
  { value: COVERAGE_HALF_AM, label: 'Morning off', description: 'Unavailable until lunch' },
  { value: COVERAGE_HALF_PM, label: 'Afternoon off', description: 'Leave after lunch' },
  { value: COVERAGE_CUSTOM, label: 'Partial hours', description: 'Specific start and end time' },
];

const COVERAGE_LABELS = Object.fromEntries(COVERAGE_OPTIONS.map((o) => [o.value, o.label]));

export function isSingleDayRange(startDate, endDate) {
  return Boolean(startDate && endDate && startDate === endDate);
}

/** HTML time input value from API `HH:MM:SS` or `HH:MM`. */
export function toTimeInputValue(apiTime) {
  if (!apiTime) return '';
  const s = String(apiTime).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

/** API expects `HH:MM:SS`. */
export function toApiTimeValue(inputTime) {
  if (!inputTime) return null;
  const s = String(inputTime).trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{1,2}:\d{2}$/.test(s)) return `${s}:00`;
  return null;
}

function compareTimeStrings(a, b) {
  const ta = toApiTimeValue(a);
  const tb = toApiTimeValue(b);
  if (!ta || !tb) return 0;
  return ta.localeCompare(tb);
}

function validateCustomWindow(startTime, endTime, label) {
  if (!startTime || !endTime) {
    return {
      ok: false,
      title: 'Times required',
      description: `Enter both start and end times for ${label}.`,
    };
  }
  if (compareTimeStrings(startTime, endTime) >= 0) {
    return {
      ok: false,
      title: 'Invalid time range',
      description: `End time must be after start time for ${label}.`,
    };
  }
  return { ok: true };
}

/**
 * @param {object} coverageState
 * @returns {{ ok: true, fields: object } | { ok: false, title: string, description: string }}
 */
export function buildCoveragePayload({
  startDate,
  endDate,
  coverage,
  startDayCoverage,
  endDayCoverage,
  startTime,
  endTime,
  endStartTime,
  endEndTime,
}) {
  const single = isSingleDayRange(startDate, endDate);
  const fields = {};

  if (single) {
    const cov = coverage || COVERAGE_FULL_DAY;
    fields.coverage = cov;
    if (cov === COVERAGE_CUSTOM) {
      const v = validateCustomWindow(startTime, endTime, 'this day');
      if (!v.ok) return v;
      fields.start_time = toApiTimeValue(startTime);
      fields.end_time = toApiTimeValue(endTime);
    }
    return { ok: true, fields };
  }

  const startCov = startDayCoverage || COVERAGE_FULL_DAY;
  const endCov = endDayCoverage || COVERAGE_FULL_DAY;
  fields.start_day_coverage = startCov;
  fields.end_day_coverage = endCov;

  if (startCov === COVERAGE_CUSTOM) {
    const v = validateCustomWindow(startTime, endTime, 'the first day');
    if (!v.ok) return v;
    fields.start_time = toApiTimeValue(startTime);
    fields.end_time = toApiTimeValue(endTime);
  }
  if (endCov === COVERAGE_CUSTOM) {
    const v = validateCustomWindow(endStartTime, endEndTime, 'the last day');
    if (!v.ok) return v;
    fields.end_start_time = toApiTimeValue(endStartTime);
    fields.end_end_time = toApiTimeValue(endEndTime);
  }

  return { ok: true, fields };
}

/** Map API row → form state for create/edit dialogs. */
export function coverageStateFromRow(row) {
  const start = row?.start_date || '';
  const end = row?.end_date || start;
  const single =
    row?.is_single_day != null ? Boolean(row.is_single_day) : isSingleDayRange(start, end);

  if (single) {
    return {
      coverage: row?.coverage || COVERAGE_FULL_DAY,
      startDayCoverage: COVERAGE_FULL_DAY,
      endDayCoverage: COVERAGE_FULL_DAY,
      startTime: toTimeInputValue(row?.start_time) || '09:00',
      endTime: toTimeInputValue(row?.end_time) || '17:00',
      endStartTime: '09:00',
      endEndTime: '12:00',
    };
  }

  return {
    coverage: COVERAGE_FULL_DAY,
    startDayCoverage: row?.start_day_coverage || COVERAGE_FULL_DAY,
    endDayCoverage: row?.end_day_coverage || COVERAGE_FULL_DAY,
    startTime: toTimeInputValue(row?.start_time) || '09:00',
    endTime: toTimeInputValue(row?.end_time) || '12:00',
    endStartTime: toTimeInputValue(row?.end_start_time) || '09:00',
    endEndTime: toTimeInputValue(row?.end_end_time) || '12:00',
  };
}

export const DEFAULT_COVERAGE_FORM = {
  coverage: COVERAGE_FULL_DAY,
  startDayCoverage: COVERAGE_FULL_DAY,
  endDayCoverage: COVERAGE_FULL_DAY,
  startTime: '09:00',
  endTime: '17:00',
  endStartTime: '09:00',
  endEndTime: '12:00',
};

function formatTimeRange(start, end) {
  const a = toTimeInputValue(start);
  const b = toTimeInputValue(end);
  if (!a || !b) return null;
  return `${a} – ${b}`;
}

/** Human-readable schedule line for list/calendar. */
export function formatTimeOffScheduleSummary(row) {
  if (!row) return '—';
  const single =
    row.is_single_day != null
      ? Boolean(row.is_single_day)
      : isSingleDayRange(row.start_date, row.end_date);

  if (single) {
    const cov = row.coverage || COVERAGE_FULL_DAY;
    if (cov === COVERAGE_CUSTOM) {
      const range = formatTimeRange(row.start_time, row.end_time);
      return range ? `Partial · ${range}` : COVERAGE_LABELS[COVERAGE_CUSTOM];
    }
    return COVERAGE_LABELS[cov] || 'Full day';
  }

  const startLabel = COVERAGE_LABELS[row.start_day_coverage] || 'Full day';
  const endLabel = COVERAGE_LABELS[row.end_day_coverage] || 'Full day';
  const parts = [];

  if (row.start_day_coverage === COVERAGE_CUSTOM) {
    const range = formatTimeRange(row.start_time, row.end_time);
    parts.push(`First: ${range || 'Partial'}`);
  } else if (row.start_day_coverage && row.start_day_coverage !== COVERAGE_FULL_DAY) {
    parts.push(`First: ${startLabel}`);
  }

  if (row.end_day_coverage === COVERAGE_CUSTOM) {
    const range = formatTimeRange(row.end_start_time, row.end_end_time);
    parts.push(`Last: ${range || 'Partial'}`);
  } else if (row.end_day_coverage && row.end_day_coverage !== COVERAGE_FULL_DAY) {
    parts.push(`Last: ${endLabel}`);
  }

  if (parts.length) return parts.join(' · ');
  if (startLabel === 'Full day' && endLabel === 'Full day') return 'All days full off';
  return `First: ${startLabel} · Last: ${endLabel}`;
}

export function formatEquivalentDays(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const label = n === 1 ? 'day' : 'days';
  return `${n} ${label}`;
}
