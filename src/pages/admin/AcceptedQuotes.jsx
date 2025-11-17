import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Card, CardContent, TextField } from '@mui/material';
import AcceptedQuote from '../../components/admin/quotes/AcceptedQuote.jsx';
import { useGetJobsQuery } from '../../store/api/jobsApi.js';
import { EditJobDialog } from '../../components/admin/jobs/EditJobDialog.jsx';

const AcceptedQuotes = () => {
  const [selectedJob, setSelectedJob] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [filters, setFilters] = useState({
    status: "to_convert",
    search: '',
  });


  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [filters]);

  const { data: jobsData, isLoading: isFetching, isError, error } = useGetJobsQuery({ ...debouncedFilters });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const handleEdit = (job) => {
    setSelectedJob(job)
    setEditDialogOpen(true)
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Accepted Quotes
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Quotes that became jobs.
      </Typography>

      <Box mb={3}>
        <TextField
          label="Search quotes..."
          variant="outlined"
          size="small"
          fullWidth
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search by client, job name, etc."
        />
      </Box>

      {/* Loading State */}
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.data?.message || 'Failed to load quotes. Please try again.'}
        </Alert>
      )}

      {/* Empty State */}
      {!isFetching && !isError && (!jobsData?.results || jobsData.results.length === 0) && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            bgcolor: 'action.hover',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Accepted Quotes Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quotes will appear here once they are accepted and ready to convert.
          </Typography>
        </Box>
      )}

      {/* Grid of Quote Cards */}
      {!isFetching && !isError && jobsData?.results && jobsData.results.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 2, // 16px gap between cards
            width: '100%',
            alignItems:"stretch"
          }}
        >
          {jobsData.results.map((quote) => (
            <AcceptedQuote key={quote.id} quote={quote} handleEdit={handleEdit}/>
          ))}
        </Box>
      )}

      {selectedJob && (
        <EditJobDialog
          job={selectedJob}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          objective={"convert"}
        />
      )}
    </Box>
  );
};

export default AcceptedQuotes;