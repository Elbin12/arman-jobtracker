import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Alert, Card, CardContent, TextField } from '@mui/material';
import AcceptedQuote from '../../components/admin/quotes/AcceptedQuote.jsx';
import { useGetJobsQuery, useDeleteJobMutation, jobsApi } from '../../store/api/jobsApi.js';
import { EditJobDialog } from '../../components/admin/jobs/EditJobDialog.jsx';
import { QuoteCardSkeleton } from '../../components/ui/skeletons';
import { useDispatch } from 'react-redux';
import { useToast } from '@/hooks/use-toast';
import DeleteJobDialog from '../../components/admin/jobs/DeleteJobDialog.jsx';

const AcceptedQuotes = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState(null)
  const [deleteJob] = useDeleteJobMutation()

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

  const { data: jobsData, isLoading: isFetching, isError, error, refetch } = useGetJobsQuery({ ...debouncedFilters });

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

  const handleJobUpdate = (result) => {
    // Refetch the quotes list after successful conversion
    // The quote should no longer appear in the list (status changed from to_convert)
    refetch();
    // Close the dialog and clear selected job
    setEditDialogOpen(false);
    setSelectedJob(null);
  }

  const handleDelete = (quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  }

  const handleDeleteConfirm = async (quoteToDelete, option) => {
    if (!quoteToDelete) return;
    
    const jobId = quoteToDelete.id || quoteToDelete.job_id;
    if (!jobId) {
      toast({
        title: "Error",
        description: "Quote ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      // await deleteJob(jobId).unwrap();

      setQuoteToDelete(null);
      setDeleteDialogOpen(false);
      
      // Update the cache to remove the deleted quote
      dispatch(
        jobsApi.util.updateQueryData(
          "getJobs",
          { ...debouncedFilters },
          (draft) => {
            const index = draft.results.findIndex(j => 
              j.id === jobId || j.job_id === jobId
            );
            if (index !== -1) {
              draft.results.splice(index, 1);
              if (draft.count) {
                draft.count = Math.max(0, draft.count - 1);
              }
            }
          }
        )
      );

      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    }
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
        <QuoteCardSkeleton count={6} />
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
            alignItems:"stretch",
            bgcolor: 'primary.red'
          }}
        >
          {jobsData.results.map((quote) => (
            <AcceptedQuote 
              key={quote.id} 
              quote={quote} 
              handleEdit={handleEdit}
              handleDelete={handleDelete}
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
          objective={"convert"}
          handleJobUpdate={handleJobUpdate}
        />
      )}

      {quoteToDelete && (
        <DeleteJobDialog
          job={quoteToDelete}
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setQuoteToDelete(null);
          }}
          onDelete={handleDeleteConfirm}
        />
      )}
    </Box>
  );
};

export default AcceptedQuotes;