import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, TextField } from '@mui/material';
import { useGetJobsQuery, jobsApi } from '../../store/api/jobsApi.js';
import { useGetEmployeesQuery } from '../../store/api/payrollApi';
import { JobCard } from '../../components/admin/jobs/JobCard.jsx';
import { EditJobDialog } from '../../components/admin/jobs/EditJobDialog.jsx';
import { JobCardSkeleton } from '../../components/ui/skeletons';
import { useDispatch } from 'react-redux';
import DeleteJobDialog from '../../components/admin/jobs/DeleteJobDialog.jsx';

const OnHoldJobs = () => {
  const dispatch = useDispatch();
  const [selectedJob, setSelectedJob] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const [filters, setFilters] = useState({
    status: 'onhold',
    search: '',
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400);
    return () => clearTimeout(handler);
  }, [filters]);

  const { data: jobsData, isLoading: isFetching, isError, error, refetch } = useGetJobsQuery({ ...debouncedFilters });
  const { data: assigneesData } = useGetEmployeesQuery({ is_active: true });
  const users = assigneesData?.results || [];

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleEdit = (job) => {
    setSelectedJob(job);
    setEditDialogOpen(true);
  };

  const handleJobUpdate = () => {
    refetch();
    setEditDialogOpen(false);
    setSelectedJob(null);
  };

  const handleDelete = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = (job, option) => {
    if (!job) return;
    const jobId = job.id || job.job_id;
    if (!jobId) return;

    setJobToDelete(null);
    setDeleteDialogOpen(false);

    dispatch(
      jobsApi.util.updateQueryData('getJobs', { ...debouncedFilters }, (draft) => {
        const index = draft.results.findIndex((j) => j.id === jobId || j.job_id === jobId);
        if (index !== -1) {
          draft.results.splice(index, 1);
          if (draft.count) draft.count = Math.max(0, draft.count - 1);
        }
      })
    );
  };

  const jobs = jobsData?.results || [];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        On Hold Jobs
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Jobs that are currently on hold.
      </Typography>

      <Box mb={3}>
        <TextField
          label="Search jobs..."
          variant="outlined"
          size="small"
          fullWidth
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search by client, job name, etc."
        />
      </Box>

      {isFetching && <JobCardSkeleton count={6} />}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.data?.message || 'Failed to load jobs. Please try again.'}
        </Alert>
      )}

      {!isFetching && !isError && jobs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No On Hold Jobs Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Jobs will appear here when their status is set to On Hold.
          </Typography>
        </Box>
      )}

      {!isFetching && !isError && jobs.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 2,
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          {jobs.map((job) => (
            <JobCard
              key={job.id || job.job_id}
              job={job}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdate={handleJobUpdate}
              users={users}
            />
          ))}
        </Box>
      )}

      {selectedJob && (
        <EditJobDialog
          job={selectedJob}
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedJob(null);
          }}
          handleJobUpdate={handleJobUpdate}
          users={users}
        />
      )}

      {jobToDelete && (
        <DeleteJobDialog
          job={jobToDelete}
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setJobToDelete(null);
          }}
          onDelete={handleDeleteConfirm}
        />
      )}
    </Box>
  );
};

export default OnHoldJobs;
