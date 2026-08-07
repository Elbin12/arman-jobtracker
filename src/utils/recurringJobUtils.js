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

export const jobsBelongToSameRecurringSeries = (candidate, source) => {
  if (!isRecurringJob(source) || !candidate) return false;

  if (hasRecurringSeriesId(source) && candidate.series_id) {
    return candidate.series_id === source.series_id;
  }

  return (
    candidate.job_type === 'recurring' &&
    candidate.title === source.title &&
    candidate.repeat_every === source.repeat_every &&
    candidate.repeat_unit === source.repeat_unit &&
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
  if (option === 'future') return isFutureSeriesOccurrence(candidate, now);
  return false;
};
