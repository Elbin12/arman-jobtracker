import React, { useMemo } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { JobCard } from '../jobs/JobCard';
import { useGetJobDetailsQuery, useGetPublicJobDetailsQuery } from '../../../store/api/jobsApi';

/**
 * Loads full job from the jobs API and renders the standard JobCard (read-only),
 * merged with the snapshot from the contact CRM payload.
 * @param {boolean} [usePublicJobApi] — if true, fetches GET …/job/public/jobs/{id}/ (portal contact view)
 */
export function ContactJobJobCard({ jobLite, usePublicJobApi = false }) {
  const jobId = jobLite?.job_id || jobLite?.id;
  const internal = useGetJobDetailsQuery(jobId, { skip: !jobId || usePublicJobApi });
  const pub = useGetPublicJobDetailsQuery(jobId, { skip: !jobId || !usePublicJobApi });
  const { data: full, isLoading, isError } = usePublicJobApi ? pub : internal;

  const job = useMemo(() => {
    if (!jobLite) return null;
    const merged = {
      ...jobLite,
      ...(full || {}),
      id: full?.id ?? jobLite.id,
      job_id: full?.job_id ?? jobLite.job_id ?? jobLite.id,
    };
    if (merged.submission == null && merged.submission_id != null) {
      merged.submission = merged.submission_id;
    }
    return merged;
  }, [jobLite, full]);

  if (!jobLite) return null;

  if (isLoading && !full) {
    return (
      <Box>
        <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: '100%',
        '& .MuiCard-root': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)',
          bgcolor: 'background.paper',
        },
        /* Default JobCard uses embeddedInDialog → CardContent p:0; omit it so inner content gets normal padding */
      }}
    >
      <JobCard job={job} readOnly users={[]} />
      {isError && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 1.5, display: 'block' }}>
          Live job details could not be loaded; showing data from this contact record.
        </Typography>
      )}
    </Box>
  );
}
