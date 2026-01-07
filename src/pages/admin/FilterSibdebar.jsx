    import { useState, useEffect } from "react"
import {
  Drawer,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Chip,
  InputAdornment,
  OutlinedInput,
} from "@mui/material"
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material"

const STATUS_CHOICES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'service_due', label: 'Service Due' },
  { value: 'on_the_way', label: 'On The Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const JOB_TYPE_CHOICES = [
  { value: 'one_time', label: 'One Time' },
  { value: 'recurring', label: 'Recurring' },
]

export function FilterSidebar({ 
  open, 
  onClose, 
  onApplyFilters,
  assignees = [],
  initialFilters = {},
  userRole = "worker"
}) {
  // Helper function to parse assignee_ids from string format "[1,2,3]" to array
  const parseAssigneeIds = (assigneeIds) => {
    if (Array.isArray(assigneeIds)) {
      return assigneeIds;
    }
    if (typeof assigneeIds === 'string') {
      const cleaned = assigneeIds.replace(/[\[\]]/g, '');
      return cleaned 
        ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];
    }
    return [];
  };

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    job_type: '',
    assignee_ids: parseAssigneeIds(initialFilters.assignee_ids || []),
    ...initialFilters,
    assignee_ids: parseAssigneeIds(initialFilters.assignee_ids || [])
  })

  useEffect(() => {
    if (open && initialFilters) {
      setFilters({
        search: initialFilters.search || '',
        status: initialFilters.status || '',
        job_type: initialFilters.job_type || '',
        assignee_ids: parseAssigneeIds(initialFilters.assignee_ids || [])
      })
    }
  }, [open, initialFilters])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleApply = () => {
    // Build query params object
    const params = {}
    
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.job_type) params.job_type = filters.job_type
    // Only include assignee_ids for non-worker roles
    if (userRole !== "worker" && filters.assignee_ids.length > 0) {
        params.assignee_ids = `[${filters.assignee_ids.join(',')}]`;
    }
    
    onApplyFilters(params)
    onClose()
  }

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      status: '',
      job_type: '',
      assignee_ids: []
    }
    setFilters(clearedFilters)
    onApplyFilters({})
  }

  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.job_type ? 1 : 0) +
    (userRole !== "worker" && filters.assignee_ids.length > 0 ? 1 : 0)

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: { xs: '100%', sm: 400 },
          zIndex: 1200, // Modal layer
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6">
              Manage Filters
            </Typography>
            {activeFilterCount > 0 && (
              <Chip 
                label={activeFilterCount} 
                size="small" 
                color="primary"
              />
            )}
          </Box>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Filters Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                Search
              </Typography>
              <TextField
                fullWidth
                placeholder="Search jobs, customers..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Divider />

            {/* Status Filter */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                Status
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>All Statuses</em>
                  </MenuItem>
                  {STATUS_CHOICES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Job Type Filter */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                Job Type
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={filters.job_type}
                  onChange={(e) => handleFilterChange('job_type', e.target.value)}
                  displayEmpty
                  aria-label="Filter by job type"
                  sx={{
                    minHeight: '44px',
                  }}
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  {JOB_TYPE_CHOICES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Assignee Filter - Only visible for non-worker roles */}
            {userRole !== "worker" && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                    Assignees
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      multiple
                      value={filters.assignee_ids}
                      onChange={(e) => handleFilterChange('assignee_ids', e.target.value)}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <em>All Assignees</em>
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((id) => {
                              const assignee = assignees.find(a => a.id === id)
                              return (
                                <Chip 
                                  key={id} 
                                  label={assignee?.first_name + assignee.last_name} 
                                  size="small" 
                                />
                              )
                            })}
                          </Box>
                        )
                      }}
                    >
                      {assignees.map((assignee) => (
                        <MenuItem key={assignee.id} value={assignee.id}>
                          {assignee.first_name} {assignee?.last_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 2
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClear}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}