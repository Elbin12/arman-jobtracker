import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  Stack,
  Divider,
  Pagination,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  useGetPayoutsQuery,
  useUpdatePayoutMutation,
  useDeletePayoutMutation,
  useGetEmployeesQuery,
} from '../../../store/api/payrollApi';
import { TableSkeleton } from '../../../components/ui/skeletons';
import { useSelector } from 'react-redux';

const PayrollReports = () => {
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role || 'worker';
  const canEditDelete = ['admin', 'supervisor', "manager"].includes(userRole);

  const [filters, setFilters] = useState({
    employee: '',
    type: '',
    project_title: '',
    start_date: '',
    end_date: '',
  });

  const [page, setPage] = useState(1);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    rate_percentage: '',
    project_value: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, type: '', message: '' });

  // Build query params from filters
  const queryParams = useMemo(() => {
    const params = {};
    if (filters.employee) params.employee = filters.employee;
    if (filters.type) params.type = filters.type;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.project_title) params.project_title = filters.project_title;
    params.page = page;

    return params;
  }, [filters, page]);

  const { data: payoutsData, isLoading, isFetching, refetch } = useGetPayoutsQuery(queryParams);
  const { data: employeesData, isLoading: loadingEmployees } = useGetEmployeesQuery({ is_active: true });
  const [updatePayout, { isLoading: updating }] = useUpdatePayoutMutation();
  const [deletePayout, { isLoading: deleting }] = useDeletePayoutMutation();

  const payouts = payoutsData?.results || [];
  const employees = employeesData?.results || [];
  const totalCount = payoutsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);
  
  // Determine if we should show time entry columns (clock in, clock out, total hours)
  const showTimeColumns = filters.type === 'hourly' || payouts.some(p => p.payout_type === 'hourly' && p.time_entry_details);
  
  // Calculate summary statistics
  const   summary = useMemo(() => {
    const totalAmount = payouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const projectPayouts = payouts.filter(p => p.payout_type === 'project');
    const hourlyPayouts = payouts.filter(p => p.payout_type === 'hourly');
    
    return {
      totalAmount,
      totalCount: payouts.length,
      projectCount: projectPayouts.length,
      hourlyCount: hourlyPayouts.length,
      projectAmount: projectPayouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      hourlyAmount: hourlyPayouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    };
  }, [payouts]);

  const showNotification = (type, message) => {
    setNotification({ open: true, type, message });
    setTimeout(() => setNotification({ open: false, type: '', message: '' }), 5000);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleClearFilters = () => {
    setFilters({
      employee: '',
      type: '',
      project_title: '',
      start_date: '',
      end_date: '',
    });
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.amount || parseFloat(editFormData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (editFormData.rate_percentage && 
        (parseFloat(editFormData.rate_percentage) < 0 || parseFloat(editFormData.rate_percentage) > 100)) {
      errors.rate_percentage = 'Rate must be between 0 and 100';
    }
    
    if (editFormData.project_value && parseFloat(editFormData.project_value) < 0) {
      errors.project_value = 'Project value cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = (payout) => {
    setSelectedPayout(payout);
    setEditFormData({
      amount: payout.amount || '',
      rate_percentage: payout.rate_percentage || '',
      project_value: payout.project_value || '',
      notes: payout.notes || '',
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      return;
    }

    try {
      const updateData = {
        amount: parseFloat(editFormData.amount),
      };
      
      if (editFormData.rate_percentage) {
        updateData.rate_percentage = parseFloat(editFormData.rate_percentage);
      }
      
      if (editFormData.project_value) {
        updateData.project_value = parseFloat(editFormData.project_value);
      }
      
      if (editFormData.notes) {
        updateData.notes = editFormData.notes;
      }

      await updatePayout({
        id: selectedPayout.id,
        ...updateData,
      }).unwrap();
      
      setEditDialogOpen(false);
      showNotification('success', 'Payout updated successfully');
      refetch();
    } catch (err) {
      showNotification('error', err.data?.detail || err.data?.message || 'Failed to update payout');
    }
  };

  const handleDeleteConfirm = (payout) => {
    setSelectedPayout(payout);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deletePayout(selectedPayout.id).unwrap();
      setDeleteDialogOpen(false);
      showNotification('success', 'Payout deleted successfully');
      refetch();
    } catch (err) {
      showNotification('error', err.data?.detail || err.data?.message || 'Failed to delete payout');
    }
  };

  const handleExport = () => {
    // Prepare CSV data
    const headers = ['Employee', 'Type', 'Project/Description', 'Amount', 'Rate', 'Project Value', 'Date', 'Notes'];
    const rows = payouts.map(p => [
      p.employee_name || 'N/A',
      p.payout_type || 'project',
      p.project_title || 'N/A',
      p.amount || '0',
      p.rate_percentage 
        ? `${parseFloat(p.rate_percentage).toFixed(2)}${p.payout_type === 'hourly' ? '/hr' : '%'}`
        : 'N/A',
      p.project_value || 'N/A',
      formatDate(p.created_at),
      p.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Payroll Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive view of all employee payouts and earnings
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh data">
              <IconButton onClick={() => refetch()} disabled={isFetching}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={payouts.length === 0 || isLoading}
            >
              Export
            </Button>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                bgcolor: 'primary.50',
                border: 'none',
                boxShadow: 1,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  transition: 'all 0.2s ease-in-out',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'primary.100',
                  opacity: 0.3,
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>
                      Total Payouts
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                      {summary.totalCount} transactions
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.100',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 2,
                    }}
                  >
                    <MoneyIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                bgcolor: 'info.50',
                border: 'none',
                boxShadow: 1,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  transition: 'all 0.2s ease-in-out',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'info.100',
                  opacity: 0.3,
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>
                      Project Payouts
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                      {formatCurrency(summary.projectAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                      {summary.projectCount} projects
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'info.100',
                      color: 'info.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 2,
                    }}
                  >
                    <WorkIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                bgcolor: 'success.50',
                border: 'none',
                boxShadow: 1,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  transition: 'all 0.2s ease-in-out',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'success.100',
                  opacity: 0.3,
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>
                      Hourly Payouts
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                      {formatCurrency(summary.hourlyAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                      {summary.hourlyCount} entries
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'success.100',
                      color: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 2,
                    }}
                  >
                    <TimeIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                bgcolor: 'warning.50',
                border: 'none',
                boxShadow: 1,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  transition: 'all 0.2s ease-in-out',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'warning.100',
                  opacity: 0.3,
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>
                      Average Payout
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                      {formatCurrency(summary.totalCount > 0 ? summary.totalAmount / summary.totalCount : 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                      per transaction
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'warning.100',
                      color: 'warning.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 2,
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Notification */}
      {notification.open && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 2 }} 
          onClose={() => setNotification({ open: false, type: '', message: '' })}
        >
          {notification.message}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterIcon />
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
            </Box>
            <Button
              variant="text"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              disabled={!Object.values(filters).some(v => v)}
            >
              Clear All
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={filters.employee}
                  onChange={(e) => handleFilterChange('employee', e.target.value)}
                  disabled={loadingEmployees}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Project Title"
                value={filters.project_title}
                onChange={(e) => handleFilterChange('project_title', e.target.value)}
                placeholder="Search projects..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Project/Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Rate</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Project Value</TableCell>
                  {showTimeColumns && (
                    <>
                      <TableCell sx={{ fontWeight: 600 }}>Clock In</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Clock Out</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total Hours</TableCell>
                    </>
                  )}
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  {canEditDelete && (
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading || isFetching ? (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: showTimeColumns ? (canEditDelete ? 11 : 10) : (canEditDelete ? 8 : 7) }).map((_, j) => (
                          <TableCell key={j}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 20,
                                  bgcolor: 'action.hover',
                                  borderRadius: 1,
                                  animation: 'pulse 1.5s ease-in-out infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                  },
                                }}
                              />
                            </Box>
                    </TableCell>
                        ))}
                  </TableRow>
                    ))}
                  </>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showTimeColumns ? (canEditDelete ? 11 : 10) : (canEditDelete ? 8 : 7)} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        No payouts found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {Object.values(filters).some(v => v) 
                          ? 'Try adjusting your filters'
                          : 'No payout records available'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {payout.employee_name || 'Unknown'}
                        </Typography>
                        {payout.employee_email && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {payout.employee_email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payout.payout_type === 'bonus_first_time' ? 'Fist time bonus' : payout.payout_type === 'bonus_quoted_by' ? 'Quoted by bonus' : payout.payout_type || 'project'}
                          size="small"
                          color={payout.payout_type === 'hourly' ? 'primary' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={payout.project_title || 'N/A'}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 250, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {payout.project_title || 'N/A'}
                          </Typography>
                        </Tooltip>
                        {payout.notes && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {payout.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(payout.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {payout.rate_percentage ? (
                          <Typography variant="body2">
                            {parseFloat(payout.rate_percentage).toFixed(2)}
                            {payout.payout_type === 'hourly' ? '/hr' : '%'}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {payout.project_value ? (
                          <Typography variant="body2">
                            {formatCurrency(payout.project_value)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      {showTimeColumns && (
                        <>
                          <TableCell>
                            {payout.payout_type === 'hourly' && payout.time_entry_details ? (
                              <Typography variant="body2">
                                {formatTime(payout.time_entry_details.check_in_time)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {payout.payout_type === 'hourly' && payout.time_entry_details ? (
                              <Typography variant="body2">
                                {payout.time_entry_details.check_out_time 
                                  ? formatTime(payout.time_entry_details.check_out_time)
                                  : '—'}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {payout.payout_type === 'hourly' && payout.time_entry_details ? (
                              <Typography variant="body2" fontWeight={500}>
                                {payout.time_entry_details.total_hours 
                                  ? `${parseFloat(payout.time_entry_details.total_hours).toFixed(2)}h`
                                  : '—'}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payout.created_at)}
                        </Typography>
                      </TableCell>
                      {canEditDelete && (
                        <TableCell align="center">
                          <Tooltip title="Edit payout">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(payout)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete payout">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteConfirm(payout)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!isLoading && !isFetching && payouts.length > 0 && (
            <>
              <Divider />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2,
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              > 
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !updating && setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Edit Payout
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {selectedPayout && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Editing payout for <strong>{selectedPayout.employee_name}</strong>
              {selectedPayout.project_title && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Project: {selectedPayout.project_title}
                </Typography>
              )}
            </Alert>
          )}
          {selectedPayout?.payout_type === 'hourly' && selectedPayout?.time_entry_details && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Time Entry Details
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Clock In:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatTime(selectedPayout.time_entry_details.check_in_time)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Clock Out:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedPayout.time_entry_details.check_out_time
                      ? formatTime(selectedPayout.time_entry_details.check_out_time)
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Hours:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedPayout.time_entry_details.total_hours
                      ? `${parseFloat(selectedPayout.time_entry_details.total_hours).toFixed(2)}h`
                      : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rate Percentage"
                type="number"
                value={editFormData.rate_percentage}
                onChange={(e) => setEditFormData({ ...editFormData, rate_percentage: e.target.value })}
                error={!!formErrors.rate_percentage}
                helperText={formErrors.rate_percentage || 'Optional: 0-100'}
                InputProps={{
                  endAdornment: <Typography>%</Typography>,
                }}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project Value"
                type="number"
                value={editFormData.project_value}
                onChange={(e) => setEditFormData({ ...editFormData, project_value: e.target.value })}
                error={!!formErrors.project_value}
                helperText={formErrors.project_value || 'Optional'}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Add any additional notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={updating}
            startIcon={updating && <CircularProgress size={16} />}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Confirm Deletion
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone
          </Alert>
          {selectedPayout && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Are you sure you want to delete this payout?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Employee:</strong> {selectedPayout.employee_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Amount:</strong> {formatCurrency(selectedPayout.amount)}
                </Typography>
                {selectedPayout.project_title && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Project:</strong> {selectedPayout.project_title}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={16} />}
          >
            {deleting ? 'Deleting...' : 'Delete Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollReports;