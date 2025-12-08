import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  useGetPayoutsQuery,
  useUpdatePayoutMutation,
  useDeletePayoutMutation,
  useGetEmployeesQuery,
} from '../../../store/api/payrollApi';

const PayrollReports = () => {
  const [filters, setFilters] = useState({
    employee: 'all',
    type: 'all',
    projectTitle: '',
    fromDate: '',
    toDate: '',
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { data: payoutsData, isLoading } = useGetPayoutsQuery();
  const { data: employeesData } = useGetEmployeesQuery();
  const [updatePayout, { isLoading: updating }] = useUpdatePayoutMutation();
  const [deletePayout, { isLoading: deleting }] = useDeletePayoutMutation();

  const payouts = payoutsData?.results || [];
  const employees = employeesData?.results || [];

  // Filter payouts
  const filteredPayouts = payouts.filter((payout) => {
    if (filters.employee !== 'all' && String(payout.employee) !== String(filters.employee)) {
      return false;
    }
    if (filters.type !== 'all' && payout.payout_type !== filters.type) {
      return false;
    }
    if (filters.projectTitle && !payout.project_title?.toLowerCase().includes(filters.projectTitle.toLowerCase())) {
      return false;
    }
    if (filters.fromDate && new Date(payout.created_at) < new Date(filters.fromDate)) {
      return false;
    }
    if (filters.toDate && new Date(payout.created_at) > new Date(filters.toDate)) {
      return false;
    }
    return true;
  });

  // Calculate totals
  const totalAmount = filteredPayouts.reduce((sum, payout) => sum + parseFloat(payout.amount || 0), 0);
  const totalHours = filteredPayouts.reduce((sum, payout) => {
    if (payout.time_entry?.total_hours) {
      return sum + parseFloat(payout.time_entry.total_hours);
    }
    return sum;
  }, 0);

  const handleEdit = (payout) => {
    setSelectedPayout(payout);
    setEditFormData({
      amount: payout.amount,
      rate_percentage: payout.rate_percentage || '',
      project_value: payout.project_value || '',
      collaborators_count: payout.collaborators_count || 1,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    setError(null);
    try {
      await updatePayout({
        id: selectedPayout.id,
        ...editFormData,
      }).unwrap();
      setEditDialogOpen(false);
      setSuccess('Payout updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.data?.detail || 'Failed to update payout');
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deletePayout(selectedPayout.id).unwrap();
      setDeleteDialogOpen(false);
      setSuccess('Payout deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.data?.detail || 'Failed to delete payout');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      employee: 'all',
      type: 'all',
      projectTitle: '',
      fromDate: '',
      toDate: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee?.full_name || 'Unknown';
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={600} mb={1}>
          Payroll Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredPayouts.length} of {payouts.length} entries • Total ${totalAmount.toFixed(2)} • Total Hours: {totalHours.toFixed(2)}
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterIcon />
            <Typography variant="h6" fontWeight={600}>
              Filter Reports
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={filters.employee}
                  onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                  label="Employee"
                >
                  <MenuItem value="all">All employees</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="all">All types</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Project Title"
                value={filters.projectTitle}
                onChange={(e) => setFilters({ ...filters, projectTitle: e.target.value })}
                placeholder="Search project..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Clear All
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Project/Time Period</TableCell>
                  <TableCell align="right">Amount ($)</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Hours/Value</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary" py={2}>
                        No payouts found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayouts.map((payout) => (
                    <TableRow key={payout.id} hover>
                      <TableCell>
                        {getEmployeeName(payout.employee)}
                        {payout.notes?.includes('Quoted By Bonus') && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            (Quoted By Bonus)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payout.time_entry ? 'Auto' : 'Manual'}
                          size="small"
                          color={payout.time_entry ? 'default' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>{payout.payout_type || 'project'}</TableCell>
                      <TableCell>
                        {payout.project_title || payout.time_entry?.total_hours
                          ? `${payout.time_entry?.total_hours || ''} hours`
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right">${parseFloat(payout.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {payout.rate_percentage ? `${payout.rate_percentage}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {payout.project_value
                          ? `$${parseFloat(payout.project_value).toFixed(2)}`
                          : payout.time_entry?.total_hours
                          ? `${parseFloat(payout.time_entry.total_hours).toFixed(2)} hrs`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{formatDate(payout.created_at)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(payout)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setDeleteDialogOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payout</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Update payout details for {selectedPayout && getEmployeeName(selectedPayout.employee)}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount ($)"
                type="number"
                value={editFormData.amount || ''}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rate (%)"
                type="number"
                value={editFormData.rate_percentage || ''}
                onChange={(e) => setEditFormData({ ...editFormData, rate_percentage: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Value ($)"
                type="number"
                value={editFormData.project_value || ''}
                onChange={(e) => setEditFormData({ ...editFormData, project_value: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Collaborators Count"
                type="number"
                value={editFormData.collaborators_count || ''}
                onChange={(e) => setEditFormData({ ...editFormData, collaborators_count: e.target.value })}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={updating}
            sx={{
              backgroundColor: 'hsl(var(--primary))',
              '&:hover': {
                backgroundColor: 'hsl(var(--primary) / 0.9)',
              },
            }}
          >
            {updating ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this payout? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollReports;

