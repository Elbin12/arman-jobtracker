"use client"

import { useState, useEffect } from "react"
import { Badge, Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Pagination, Switch, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { useGetJobsByLocationQuery, useGetJobsQuery } from "../../store/api/jobsApi"
import { useGetAssigneesQuery } from "../../store/api/assigneesApi"
import { CalendarIcon, FilterIcon, ListIcon } from "lucide-react"
import { NewCalendar } from "../../components/admin/calendar/Calendar"
import { LocationGroupCard } from "../../components/admin/jobs/LocationGroupCard"
import { FilterSidebar } from "./FilterSibdebar"
import { LocationOn } from "@mui/icons-material"
import { JobCard } from "../../components/admin/jobs/JobCard"
import DeleteJobDialog from "../../components/admin/jobs/DeleteJobDialog"
import { EditJobDialog } from "../../components/admin/jobs/EditJobDialog"

export function Jobs() {
  const [viewMode, setViewMode] = useState("list")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
  
  const [filterParams, setFilterParams] = useState({})
  const [groupByLocation, setGroupByLocation] = useState(false)

  const [page, setPage] = useState(1);

  const { data: jobsData, isLoading: isFetching } =
    useGetJobsQuery({ ...filterParams, page }, { skip: groupByLocation });

  const { data: locationData, isLoading: isLocationsFetching } =
    useGetJobsByLocationQuery({ ...filterParams, page }, { skip: !groupByLocation });

  const { data: assigneesData, isLoading: assigneesLoading } = useGetAssigneesQuery()

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
    // let updatedJobs = jobs

    // if (option === "sequence" && jobToDelete.is_recurring) {
    //   updatedJobs = jobs.filter(
    //     (j) =>
    //       !(j.customer_name === jobToDelete.customer_name && j.job_type === jobToDelete.job_type && j.is_recurring),
    //   )
    // } else {
    //   updatedJobs = jobs.filter((j) => j.id !== jobToDelete.id)
    // }
  }


  if (isFetching || isLocationsFetching || assigneesLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    )
  }

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
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newView) => newView && setViewMode(newView)}
          size="small"
        >
          <ToggleButton value="list">
            <ListIcon sx={{ mr: 1 }} />
            List
          </ToggleButton>
          <ToggleButton value="calendar">
            <CalendarIcon sx={{ mr: 1 }} />
            Calendar
          </ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel
          control={<Switch checked={groupByLocation} onChange={(e) => setGroupByLocation(e.target.checked)} />}
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOn fontSize="small" />
              Group by Location
            </Box>
          }
        />
      </Box>

      {viewMode === "calendar" ? (
        <NewCalendar jobs={jobs} users={users} />
      ) : (
        <>
          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
          </Typography>

          {/* Jobs Display */}
          {jobs.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" gutterBottom>
                  No jobs found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or create a new job.
                </Typography>
              </CardContent>
            </Card>):
          groupByLocation && locationData?.results ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))',
                gap: 2, // 16px gap between cards
                width: '100%',
                alignItems:"stretch",
              }}
            >
              {locationData?.results.map((locationInfo, index) => (
                <LocationGroupCard locationInfo={locationInfo} />
              ))}
            </Box>
          ) : 
          (
            <Box
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                gap: 2,
                alignItems: 'stretch',
              }}
            >
              {jobs.map((job) => (
                <JobCard
                  job={job}
                  onEdit={handleEdit}
                  onDelete={handleDeleteJob}
                  users={users}
                />
              ))}
            </Box>
          )}
        </>
      )}

      <FilterSidebar
        open={filterSidebarOpen}
        onClose={() => setFilterSidebarOpen(false)}
        onApplyFilters={(filters)=>{setFilterParams(filters)}}
        assignees={users}
        initialFilters={filterParams}
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