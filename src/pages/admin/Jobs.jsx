"use client"

import { useState, useEffect } from "react"
import { Badge, Box, Button, Card, CardContent, FormControlLabel, Pagination, Switch, Typography } from "@mui/material"
import { useGetLocationsQuery, useGetJobsQuery, jobsApi } from "../../store/api/jobsApi"
import { useGetEmployeesQuery } from "../../store/api/payrollApi"
import { FilterIcon } from "lucide-react"
import { LocationGroupCard } from "../../components/admin/jobs/LocationGroupCard"
import { FilterSidebar } from "./FilterSibdebar"
import { LocationOn } from "@mui/icons-material"
import { JobCard } from "../../components/admin/jobs/JobCard"
import DeleteJobDialog from "../../components/admin/jobs/DeleteJobDialog"
import { EditJobDialog } from "../../components/admin/jobs/EditJobDialog"
import { useDispatch, useSelector } from "react-redux"
import { JobCardSkeleton, CardGridSkeleton } from "../../components/ui/skeletons"

export function Jobs() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
  
  const [filterParams, setFilterParams] = useState({})
  const [groupByLocation, setGroupByLocation] = useState(true)

  const [page, setPage] = useState(1);

  const { data: jobsData, isLoading: isFetching } =
    useGetJobsQuery({ ...filterParams, page }, { skip: groupByLocation });

  const { data: locationData, isLoading: isLocationsFetching } =
    useGetLocationsQuery({ ...filterParams, page }, { skip: !groupByLocation });

  const { data: assigneesData, isLoading: assigneesLoading } = useGetEmployeesQuery({ is_active: true })

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role || "worker";

  const totalJobs = jobsData?.count || 0;
  const totalLocations = locationData?.count || 0;

  const jobsPerPage = 20;  
  const locationPerPage = 20;

  const jobTotalPages = Math.ceil(totalJobs / jobsPerPage);
  const locationTotalPages = Math.ceil(totalLocations / locationPerPage);


  const jobs = jobsData?.results || []
  const users = assigneesData?.results || []

  const activeFilterCount = Object.keys(filterParams).filter(
    key => filterParams[key] && 
    (Array.isArray(filterParams[key]) ? filterParams[key].length > 0 : true)
  ).length

  const handleEdit = (job) => {
    setSelectedJob(job)
    setEditDialogOpen(true)
  }

  const handleDeleteJob = (jobToDelete, option) => {
    if (!jobToDelete) return
    
    // Get job ID - support both job_id and id fields
    const jobId = jobToDelete.job_id || jobToDelete.id
    if (!jobId) {
      return
    }
    
    // Update the cache to remove the deleted job
    dispatch(
      jobsApi.util.updateQueryData(
        "getJobs",
        { ...filterParams, page },
        (draft) => {
          if (option === "sequence" && jobToDelete.is_recurring) {
            // Remove all jobs in the recurring sequence
            draft.results = draft.results.filter(
              (j) => !(
                (j.customer_name === jobToDelete.customer_name && 
                 j.job_type === jobToDelete.job_type && 
                 j.is_recurring) ||
                j.series_id === jobToDelete.series_id
              )
            )
            // Update count
            if (draft.count) {
              const deletedCount = draft.results.length - (draft.count - 1)
              draft.count = Math.max(0, draft.count - deletedCount)
            }
          } else {
            // Remove only the single job
            const index = draft.results.findIndex(j => 
              j.id === jobId || j.job_id === jobId
            )
            if (index !== -1) {
              draft.results.splice(index, 1)
              // Update count
              if (draft.count) {
                draft.count = Math.max(0, draft.count - 1)
              }
            }
          }
        }
      )
    )
  }

  const handleJobUpdate = (result)=>{
    // Use the job ID from the result (supports both id and job_id)
    const jobId = result.id || result.job_id;
    if (!jobId) {
      return;
    }
    
    dispatch(
      jobsApi.util.updateQueryData(
        "getJobs",
        { ...filterParams, page },
        (draft) => {
          // Find the job by id or job_id
          const index = draft.results.findIndex(j => 
            j.id === jobId || j.job_id === jobId || j.id === result.job_id || j.job_id === result.id
          );
          if (index !== -1) {
            // Update the job with the new data from the API response
            draft.results[index] = {
              ...draft.results[index],
              ...result,
              id: result.id || result.job_id || draft.results[index].id,
              job_id: result.job_id || result.id || draft.results[index].job_id,
            };
          }
        }
      )
    );
  }


  const isLoading = isFetching || isLocationsFetching || assigneesLoading;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Jobs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your service jobs and assignments
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterSidebarOpen(true)}
          aria-label={`Manage filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          sx={{
            minHeight: { xs: '44px', sm: 'auto' },
            minWidth: { xs: '44px', sm: 'auto' },
          }}
        >
          <Badge badgeContent={activeFilterCount} color="primary">
            <Box sx={{ mr: activeFilterCount > 0 ? 2 : 0 }}>
              Manage Filters
            </Box>
          </Badge>
        </Button>
      </Box>

      {/* View Options */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 3,
        }}
      >
        <FormControlLabel
          control={
            <Switch 
              checked={groupByLocation} 
              onChange={(e) => setGroupByLocation(e.target.checked)}
              aria-label="Group jobs by location"
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOn fontSize="small" />
              Group by Location
            </Box>
          }
        />
      </Box>

      {/* Results Count */}
      {!isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {jobsData?.count || 0} job{(jobsData?.results?.length || 0) !== 1 ? "s" : ""} found
        </Typography>
      )}

      {/* Loading State */}
      {isLoading ? (
        <JobCardSkeleton count={8} />
      ) : (
        <>
          {/* Jobs Display */}
          {groupByLocation ? (
            locationData?.results && locationData.results.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: '1fr', 
                    sm: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
                    md: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))'
                  },
                  gap: 2,
                  width: '100%',
                  alignItems: "stretch",
                }}
              >
                {locationData.results.map((locationInfo, index) => (
                  <LocationGroupCard key={index} locationInfo={locationInfo} users={users}/>
                ))}
              </Box>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No locations found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria or create a new job.
                  </Typography>
                </CardContent>
              </Card>
            )
          ) : (
            jobsData?.results && jobsData.results.length > 0 ? (
              <Box
                sx={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: '1fr', 
                    sm: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                    md: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))'
                  },
                  gap: 2,
                  alignItems: 'stretch',
                }}
              >
                {jobsData.results.map((job) => (
                  <JobCard
                    key={job.id || job.job_id}
                    job={job}
                    onEdit={handleEdit}
                    onDelete={handleDeleteJob}
                    onUpdate={handleJobUpdate}
                    users={users}
                  />
                ))}
              </Box>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No jobs found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria or create a new job.
                  </Typography>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      <FilterSidebar
        open={filterSidebarOpen}
        onClose={() => setFilterSidebarOpen(false)}
        onApplyFilters={(filters) => {
          setFilterParams(filters);
          setPage(1);
        }}
        assignees={users}
        initialFilters={filterParams}
        userRole={userRole}
      />

      {!groupByLocation && jobTotalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={jobTotalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            variant="outlined" 
            shape="rounded"
          />
        </Box>
      )}

      {groupByLocation && locationTotalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={locationTotalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            variant="outlined" 
            shape="rounded"
          />
        </Box>
      )}

      {/* Edit Dialog */}
      {selectedJob && (
        <EditJobDialog
          job={selectedJob}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          users={users}
          handleJobUpdate={handleJobUpdate}
        />
      )}

      {/* Delete Dialog */}
      {selectedJob && (
        <DeleteJobDialog
          job={selectedJob}
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDelete={handleDeleteJob}
        />
      )}
    </Box>
  )
}

export default Jobs