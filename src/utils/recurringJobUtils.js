export const isRecurringJob = (job) => {
  if (!job) return false;
  return (
    job.job_type === 'recurring' ||
    job.is_recurring === true ||
    (job.series_id != null && job.series_id !== undefined && job.series_id !== '')
  );
};

export const hasRecurringSeriesId = (job) => {
  return job?.series_id != null && job.series_id !== undefined && job.series_id !== '';
};

// Legacy series siblings are titled "<base> (2)", "<base> (3)"... (matches backend).
const baseSeriesTitle = (title) => (title || '').replace(/\s*\(\d+\)\s*$/, '').trim();

export const jobsBelongToSameRecurringSeries = (candidate, source) => {
  if (!isRecurringJob(source) || !candidate) return false;

  if (hasRecurringSeriesId(source) && candidate.series_id) {
    return candidate.series_id === source.series_id;
  }

  return (
    candidate.job_type === 'recurring' &&
    !candidate.series_id &&
    baseSeriesTitle(candidate.title) === baseSeriesTitle(source.title) &&
    (
      (source.contact && candidate.contact && candidate.contact === source.contact) ||
      (source.ghl_contact_id && candidate.ghl_contact_id === source.ghl_contact_id) ||
      (source.customer_email && candidate.customer_email === source.customer_email) ||
      (source.customer_name && candidate.customer_name === source.customer_name)
    )
  );
};

const getJobScheduledTime = (job) => {
  if (!job?.scheduled_at) return null;
  const time = new Date(job.scheduled_at).getTime();
  return Number.isNaN(time) ? null : time;
};

/** True when candidate should be removed for a future-only series delete (scheduled_at >= now). */
export const isFutureSeriesOccurrence = (job, now = Date.now()) => {
  const time = getJobScheduledTime(job);
  if (time == null) return false;
  return time >= now;
};

export const shouldRemoveJobForDeleteOption = (candidate, source, option, now = Date.now()) => {
  if (!jobsBelongToSameRecurringSeries(candidate, source)) return false;
  if (option === 'sequence') return true;
  if (option === 'future') {
    // "This and future": cut off at the selected occurrence, not at now.
    // Completed jobs are kept (matches backend).
    if (candidate.status === 'completed') return false;
    const sourceTime = getJobScheduledTime(source);
    return isFutureSeriesOccurrence(candidate, sourceTime ?? now);
  }
  return false;
};

// Largest sensible "Repeat Every" per unit (must match MAX_REPEAT_EVERY in the backend
// jobtracker_app/serializers.py). Staff were entering the number of visits here,
// e.g. 19 x Semi Annual = a visit every 9.5 years.
export const MAX_REPEAT_EVERY = {
  day: 30,
  week: 12,
  month: 12,
  quarter: 4,
  semi_annual: 2,
  year: 3,
};

const REPEAT_UNIT_LABEL = {
  day: 'days',
  week: 'weeks',
  month: 'months',
  quarter: 'quarters',
  semi_annual: 'semi-annual periods',
  year: 'years',
};

/** Error message when "Repeat Every" is too large for its unit, else null. */
export const repeatEveryError = (repeatEvery, repeatUnit) => {
  const limit = MAX_REPEAT_EVERY[repeatUnit];
  if (!limit || !repeatEvery || repeatEvery <= limit) return null;
  return `"Repeat Every" can be at most ${limit} ${REPEAT_UNIT_LABEL[repeatUnit]}. Use "Occurrences" for the number of visits.`;
};

const addMonthsClamped = (date, months) => {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};

/**
 * Date of the last visit, stepping the same way the backend builds the series
 * (months are added one step at a time, clamped to the month's last day).
 * Weekly series ignore the day-of-week shift, so the result is approximate there.
 */
export const lastOccurrenceDate = (start, repeatEvery, repeatUnit, occurrences) => {
  if (!start || !repeatEvery || !repeatUnit || !occurrences) return null;
  let current = new Date(start);
  if (Number.isNaN(current.getTime())) return null;
  const monthsPerStep = { month: 1, quarter: 3, semi_annual: 6, year: 12 }[repeatUnit];
  for (let i = 1; i < occurrences; i += 1) {
    if (monthsPerStep) {
      current = addMonthsClamped(current, monthsPerStep * repeatEvery);
    } else {
      const days = repeatUnit === 'week' ? 7 * repeatEvery : repeatEvery;
      current = new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
    }
  }
  return current;
};

/** One-line summary shown under the recurrence fields, e.g. "19 visits, from Dec 3, 2026 to Jun 3, 2035". */
export const recurrenceSummary = (start, repeatEvery, repeatUnit, occurrences) => {
  const last = lastOccurrenceDate(start, repeatEvery, repeatUnit, occurrences);
  if (!last) return null;
  const fmt = (d) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  if (occurrences <= 1) return `1 visit on ${fmt(new Date(start))}`;
  return `${occurrences} visits, from ${fmt(new Date(start))} to ${fmt(last)}`;
};
