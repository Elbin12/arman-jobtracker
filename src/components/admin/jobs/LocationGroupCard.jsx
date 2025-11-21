import React, { useEffect, useState } from 'react';
import { MapPin, Clock, DollarSign, Calendar, X } from 'lucide-react';
import { jobsApi, useGetJobsByLocationQuery } from '../../../store/api/jobsApi';
import { EditJobDialog } from './EditJobDialog';
import { JobCard } from './JobCard';
import { Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';

export const LocationGroupCard = ({ locationInfo, users }) => {
  const {
    address,
    job_count,
    customer_names,
    status_counts,
    total_price,
    total_hours,
    next_scheduled,
    service_names,
  } = locationInfo;

  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  const statusConfig = {
    pending: { color: 'text-orange-600', bg: 'bg-orange-50' },
    in_progress: { color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { color: 'text-red-600', bg: 'bg-red-50' },
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    return `${month} ${day}, ${time}`;
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleEdit = (job) => {
    setSelectedJob(job)
    setEditDialogOpen(true)
  }

  const handleDeleteJob = (jobId) => {
    console.log('Delete job:', jobId);
  };

  const handleJobUpdate = (result)=>{
    console.log(selectedJob, 'selected job')
    dispatch(
      jobsApi.util.updateQueryData(
        "getJobsByLocation",
        { address: selectedJob?.customer_address },   // MUST match the original query args
        (draft) => {
          const index = draft.results.findIndex(j => j.id === selectedJob.id);
          if (index !== -1) {
            draft.results[index] = result;
          }
        }
      )
    );
  }

  console.log(selectedJob, 'selected jobww')

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        <div className="p-6 flex-grow">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <h3 className="font-semibold text-gray-900 leading-tight">
                  {address}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 ml-7">
                <span>{job_count} job{job_count !== 1 ? 's' : ''}</span>
                <span className="text-gray-400">•</span>
                <span>{customer_names?.join(', ')}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap ml-4"
            >
              View Jobs
            </button>
          </div>

          {/* Status Counts */}
          <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200">
            {Object.entries(status_counts).map(([status, count]) => {
              const config = statusConfig[status] || { color: 'text-gray-600', bg: 'bg-gray-50' };
              return (
                <div key={status} className="text-center">
                  <div className={`text-2xl font-semibold ${config.color}`}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-500 capitalize mt-1">
                    {formatStatus(status)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price and Hours */}
          <div className="flex justify-between mb-4 items-center">
            <div className="flex items-center gap-1">
              <DollarSign className="text-gray-400" size={18} />
              <span className="font-semibold text-gray-900">
                {total_price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="text-gray-400" size={18} />
              <span className="font-medium text-gray-700">
                {total_hours} hours total
              </span>
            </div>
          {/* Next Scheduled */}
          {next_scheduled && (
            <div className="bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1">
                <Calendar className="text-gray-400" size={18} />
                <div>
                  <div className="text-xs text-gray-500">Next:</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(next_scheduled)}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>


          {/* Services */}
          <div className="text-sm text-gray-600">
            {service_names?.join(', ')}
          </div>
        </div>
      </div>
      <JobsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={address}
        users={users}
        handleEdit={handleEdit}
        handleDeleteJob={handleDeleteJob}
      />
      {selectedJob && (
        <EditJobDialog
          job={selectedJob}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          users={users}
          handleJobUpdate={handleJobUpdate}
        />
      )}
    </>
  );
};

export const JobsModal = ({
  isOpen,
  onClose,
  address,
  users,
  handleEdit,
  handleDeleteJob,
}) => {
  const { data, isLoading } = useGetJobsByLocationQuery(
    { address },
  );

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth scroll="paper">
      {/* HEADER */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pr: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Jobs at Location
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
        </Box>

        <IconButton onClick={onClose}>
          <X size={22} />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent dividers sx={{ minHeight: "300px" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : data?.results.length > 0 ? (
          <Box
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(300px,100%),1fr))",
              gap: 2,
            }}
          >
            {data?.results.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={handleEdit}
                onDelete={handleDeleteJob}
                users={users}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No jobs found for this location
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* FOOTER */}
      <DialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
        >
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};