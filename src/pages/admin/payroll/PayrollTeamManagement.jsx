import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Divider,
  Stack,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as PersonIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Work as BriefcaseIcon,
  Public as GlobeIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Percent as PercentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '../../../store/api/payrollApi';
import { CardGridSkeleton } from '../../../components/ui/skeletons';

const PayrollTeamManagement = () => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    user: '',
    phone: '',
    department: '',
    position: '',
    timezone: 'America/Chicago',
    pay_scale_type: 'project',
    hourly_rate: null,
    is_administrator: false,
    is_active: null,
    status: 'active',
    emergency_contact_name: '',
    emergency_contact_number: '',
    hire_date: '',
    date_of_birth: '',
    address: '',
  });

  const [collaborationRates, setCollaborationRates] = useState([1]);

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: employeesData, isLoading } = useGetEmployeesQuery({
    search:searchTerm,
    page,
    limit,
  });
  const totalPages = Math.ceil((employeesData?.count || 0) / limit);

  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation();
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setError(null);
    setFieldErrors({});
    setCollaborationRates([1]);
    setFormData({
      user: '',
      phone: '',
      department: '',
      position: '',
      timezone: 'America/Chicago',
      pay_scale_type: 'project',
      hourly_rate: null,
      is_administrator: false,
      status: 'active',
      is_active: true,
      emergency_contact_name: '',
      emergency_contact_number: '',
      hire_date: '',
      date_of_birth: '',
      address: '',
    });
    setShowDialog(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setError(null);
    setFieldErrors({});
    // Set collaboration rates from employee data
    const memberCounts = employee.collaboration_rates?.length > 0
      ? employee.collaboration_rates.map(r => r.member_count)
      : [1];
    
    setCollaborationRates(memberCounts);

    const ratesData = Object.fromEntries(
      employee.collaboration_rates?.map(r => [
        `rate_${r.member_count}`, 
        r.percentage
      ]) || []
    );

    setFormData({
      user: employee.user_id,
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      timezone: employee.timezone || 'America/Chicago',
      pay_scale_type: employee.pay_scale_type || 'project',
      hourly_rate: employee.hourly_rate || null,
      is_administrator: employee.is_administrator || false,
      status: employee.is_active ? 'active' : 'inactive',
      is_active: employee.is_active ? true : false,
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_number: employee.emergency_contact_number || '',
      hire_date: employee.hire_date || '',
      date_of_birth: employee.date_of_birth || '',
      address: employee.address || '',
      ...ratesData
    });
    setShowDialog(true);
  };

  // Add functions to manage collaboration rates
  const addCollaborationRate = () => {
    const maxCount = Math.max(...collaborationRates, 0);
    setCollaborationRates([...collaborationRates, maxCount + 1]);
  };
  
  const removeCollaborationRate = (count) => {
    if (collaborationRates.length > 1) {
      setCollaborationRates(collaborationRates.filter(c => c !== count));
      const newFormData = { ...formData };
      delete newFormData[`rate_${count}`];
      setFormData(newFormData);
    }
  };

  const handleSave = async () => {
    setError(null);
    setFieldErrors({});
    setSuccess(null);

    try {
      const payload = {
        ...formData,
        hourly_rate: formData.pay_scale_type === 'hourly' ? parseFloat(formData.hourly_rate) : null,
      };

      if (formData.pay_scale_type === "project") {
        payload.collaboration_rates = collaborationRates
          .filter(c => formData[`rate_${c}`] != null)
          .map(c => ({
            member_count: c,
            percentage: Number(formData[`rate_${c}`])
          }));
      }

      if (selectedEmployee) {
        await updateEmployee({ id: selectedEmployee.id, ...payload }).unwrap();
        setSuccess('Employee updated successfully!');
      } else {
        await createEmployee(payload).unwrap();
        setSuccess('Employee created successfully!');
      }
      setShowDialog(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const data = err?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const detail = data.detail || data.message;
        const rest = { ...data };
        delete rest.detail;
        delete rest.message;
        const keys = Object.keys(rest);
        if (keys.length > 0) {
          const next = {};
          keys.forEach((key) => {
            const val = rest[key];
            next[key] = Array.isArray(val) ? val.join(' ') : (val != null ? String(val) : '');
          });
          setFieldErrors(next);
          setError(detail || 'Please fix the errors below.');
        } else {
          setError(detail || 'Failed to save employee');
        }
      } else {
        setError(typeof data === 'string' ? data : (data?.detail || data?.message || 'Failed to save employee'));
      }
    }
  };

  const getFieldError = (fieldName) => fieldErrors[fieldName] || null;

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteEmployee(selectedEmployee.id).unwrap();
      setShowDeleteDialog(false);
      setSuccess('Employee deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.data?.detail || 'Failed to delete employee');
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const formatTimezone = (tz) => {
    const tzMap = {
      'America/Chicago': 'CST',
      'America/New_York': 'EST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
    };
    return tzMap[tz] || tz;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Team Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your team and their compensation
            </Typography>
          </Box>
          {/* <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 1,
              borderRadius: 1,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 2,
              },
            }}
          >
            Add Team Member
          </Button> */}
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by name, email, department, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Employee Cards */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 2, // 16px gap between cards
            width: '100%',
            alignItems:"stretch"
          }}
        >
          {employeesData?.results.map((employee) => (
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              transition: "all 0.2s",
              overflow: "hidden",
              "&:hover": {
                boxShadow: 3,
                borderColor: "primary.main",
              },
            }}
          >
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Header with Avatar and Status */}
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: 'primary.main',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(employee.full_name)}
                </Avatar>
                <Box flex={1} minWidth={0}> 
                  <Box display="flex" justifyContent="space-between" alignItems="start" minWidth={0} gap={1}>
                    <Box minWidth={0}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{
                          mb: 0.5,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        >
                        {employee.full_name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          minHeight: '20px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >

                        {(employee.department || employee.position) && (
                          <>
                            <BriefcaseIcon sx={{ fontSize: 16 }} />
                            {employee.position || employee.department}
                          </>
                        )}
                      </Typography>
                    </Box>
                    <Chip
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: employee.is_active ? "green" : "red",
                            }}
                          />
                          {employee.is_active ? "Active" : "Inactive"}
                        </Box>
                      }
                      size="small"
                      variant="outlined"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        borderColor: employee.is_active? "green" : "red",
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Contact Information */}
              <Stack spacing={1.5} mb={2}>
                <Box display="flex" alignItems="center" gap={1.5} minHeight="24px">
                  <MailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      wordBreak: 'break-all',
                      maxWidth: '100%',
                    }}
                  >
                    {employee.email}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5} minHeight="24px">
                  <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {employee.phone || '—'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5} minHeight="24px">
                  <GlobeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatTimezone(employee.timezone)}
                  </Typography>
                </Box>
              </Stack>

              {/* Pay Information */}
              <Box 
                sx={{ 
                  bgcolor: 'action.hover', 
                  borderRadius: 2, 
                  p: 1.5,
                  mb: 2,
                  minHeight: '70px',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  COMPENSATION
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {employee.pay_scale_type === 'project' ? (
                    <>Project-based • {employee.collaboration_rates?.[0]?.percentage || 'N/A'}% (solo)</>
                  ) : (
                    <>${employee.hourly_rate}/hour</>
                  )}
                </Typography>
              </Box>

              {/* Collaboration Rates */}
              <Box mb={2} minHeight="60px">
                {employee.collaboration_rates && employee.collaboration_rates.length > 1 ? (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                      COLLABORATION RATES
                    </Typography>
                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(2, 1fr)"
                      gap={1}
                      >
                      {[...employee.collaboration_rates]
                        .sort((a, b) => a.member_count - b.member_count)
                        .map((rate) => (
                          <Chip
                            key={rate.id}
                            label={`${rate.member_count} members: ${rate.percentage}%`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                    </Box>
                  </>
                ) : (
                  <Box />
                )}
              </Box>

              {/* Actions */}
              <Box display="flex" gap={1} pt={2} mt="auto">
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditEmployee(employee)}
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 1.5,
                  }}
                >
                  Edit
                </Button>
                {/* <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowDeleteDialog(true);
                  }}
                  fullWidth
                  variant="outlined"
                  color="error"
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 1.5,
                  }}
                >
                  Delete
                </Button> */}
              </Box>
            </CardContent>
          </Card>
        ))}
        </Box>
      )}

      {!isLoading && employeesData?.results?.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            px: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No team members found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first team member'}
          </Typography>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={showDialog} 
        onClose={() => setShowDialog(false)} 
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}  // Full screen on mobile
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },  // No border radius on mobile
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            m: { xs: 0, sm: 2 },  // Remove margin on mobile
            maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1} minWidth={0}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  mb: 0.5,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                {selectedEmployee ? 'Edit employee details' : 'Add Team Member'}
              </Typography>
              {selectedEmployee && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    pr: 1
                  }}
                >
                  Update information for this team member
                </Typography>
              )}
            </Box>
            <IconButton 
              onClick={() => setShowDialog(false)} 
              size="small"
              sx={{ 
                mt: -0.5, 
                mr: -0.5,
                flexShrink: 0
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: 2,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',  // Smooth scrolling on iOS
          }}
        >
          <Stack spacing={{ xs: 2, sm: 2.5 }}>
            {error && (
              <Alert severity="error" onClose={() => { setError(null); setFieldErrors({}); }} sx={{ borderRadius: 1 }}>
                {error}
              </Alert>
            )}

            {/* Avatar section for editing existing employees */}
            {selectedEmployee && (
              <Box 
                display="flex" 
                alignItems="center" 
                gap={{ xs: 1.5, sm: 2 }} 
                pb={1}
                flexWrap="wrap"
              >
                <Avatar
                  sx={{
                    width: { xs: 56, sm: 64 },
                    height: { xs: 56, sm: 64 },
                    bgcolor: 'primary.main',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(selectedEmployee.full_name)}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    sx={{
                      fontSize: { xs: '0.938rem', sm: '1rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedEmployee.full_name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.813rem', sm: '0.875rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedEmployee.email}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Name Field (for new employees) */}
            {!selectedEmployee && (
              <TextField
                fullWidth
                label="Name"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            )}

            <Box display="flex" gap={2} sx={{flexWrap: { xs: 'wrap', sm: 'nowrap' }}}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                size="small"
                value={selectedEmployee?.email || ''}
                InputProps={{ readOnly: !!selectedEmployee }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />

              <TextField
                fullWidth
                label="Phone number"
                size="small"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={!!getFieldError('phone')}
                helperText={getFieldError('phone')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            </Box>

            <Box display="flex" gap={2} sx={{flexWrap: { xs: 'wrap', sm: 'nowrap' }}}>
              <TextField
                fullWidth
                label="Address"
                type="text"
                size="small"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                error={!!getFieldError('address')}
                helperText={getFieldError('address')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />

              <TextField
                fullWidth
                label="Date of birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                error={!!getFieldError('date_of_birth')}
                helperText={getFieldError('date_of_birth')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            </Box>

            <Box display="flex" gap={2} sx={{flexWrap: { xs: 'wrap', sm: 'nowrap' }}}>
              <TextField fullWidth size='small' label="Position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} error={!!getFieldError('position')} helperText={getFieldError('position')} />
              <TextField fullWidth size='small' label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} error={!!getFieldError('department')} helperText={getFieldError('department')} />
            </Box>

            <Box display="flex" gap={2} sx={{flexWrap: { xs: 'wrap', sm: 'nowrap' }}}>
              <TextField fullWidth size='small' label="Emergeny Contact Name" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} error={!!getFieldError('emergency_contact_name')} helperText={getFieldError('emergency_contact_name')} />
              <TextField type="tel" fullWidth size='small' label="Emergency Contact Number" value={formData.emergency_contact_number} onChange={(e) => setFormData({ ...formData, emergency_contact_number: e.target.value })} error={!!getFieldError('emergency_contact_number')} helperText={getFieldError('emergency_contact_number')} />
            </Box>

            <Box display="flex" gap={2} sx={{flexWrap: { xs: 'wrap', sm: 'nowrap' }}}>
              <TextField fullWidth size='small' label="Hire Date" type="date" InputLabelProps={{ shrink: true }} value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} error={!!getFieldError('hire_date')} helperText={getFieldError('hire_date')} />
            </Box>

            {/* Timezone */}
            <FormControl fullWidth size="small">
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                label="Timezone"
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="America/Chicago">Central Time (CST)</MenuItem>
                <MenuItem value="America/New_York">Eastern Time (EST)</MenuItem>
                <MenuItem value="America/Denver">Mountain Time (MST)</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time (PST)</MenuItem>
              </Select>
            </FormControl>

            {/* Pay Scale Type */}
            <FormControl fullWidth size="small">
              <InputLabel>Pay Scale Type</InputLabel>
              <Select
                value={formData.pay_scale_type}
                onChange={(e) => setFormData({ ...formData, pay_scale_type: e.target.value })}
                label="Pay Scale Type"
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="project">Project-based</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
              </Select>
            </FormControl>

            {/* Hourly Rate */}
            {formData.pay_scale_type === 'hourly' && (
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                size="small"
                value={formData.hourly_rate || ''}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                error={!!getFieldError('hourly_rate')}
                helperText={getFieldError('hourly_rate')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/hr</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            )}

            {/* Collaboration Rates for project-based */}
            {formData.pay_scale_type === 'project' && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography
                    variant="caption"
                    sx={{ 
                      fontWeight: 500, 
                      color: "text.secondary",
                      fontSize: { xs: '0.75rem', sm: '0.813rem' }
                    }}
                  >
                    Collaboration Rates (%)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addCollaborationRate}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.813rem',
                      minWidth: 'auto',
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    Add Rate
                  </Button>
                </Box>
                
                <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                  {collaborationRates.map((count) => (
                    <Grid item xs={6} sm={4} key={count}>
                      <Box position="relative">
                        <TextField
                          fullWidth
                          label={`${count} Member${count > 1 ? 's' : ''}`}
                          type="number"
                          size="small"
                          value={formData[`rate_${count}`] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [`rate_${count}`]: e.target.value })
                          }
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }
                          }}
                        />
                        {collaborationRates.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeCollaborationRate(count)}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider',
                              color: 'error.main',
                              width: 24,
                              height: 24,
                              '&:hover': {
                                bgcolor: 'error.lighter',
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Status */}
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active', status: e.target.value })}
                label="Status"
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions 
          sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 1.5, sm: 2 }, 
            gap: { xs: 1, sm: 1.5 },
            flexDirection: { xs: 'column-reverse', sm: 'row' },  // Stack buttons on mobile
          }}
        >
          <Button 
            onClick={() => setShowDialog(false)}
            variant="outlined"
            size="medium"
            fullWidth  // Full width on all screens now
            sx={{ 
              textTransform: 'none',
              px: 3,
              borderRadius: 1,
              minWidth: { sm: 100 },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="medium"
            disabled={creating || updating || !formData.user}
            fullWidth  // Full width on all screens now
            sx={{
              textTransform: 'none',
              px: 3,
              borderRadius: 1,
              minWidth: { sm: 100 },
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          >
            {(creating || updating) ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Delete Team Member
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box 
              sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                bgcolor: 'error.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <DeleteIcon sx={{ fontSize: 28, color: 'error.main' }} />
            </Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to delete <strong>{selectedEmployee?.full_name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. All associated data will be permanently removed.
            </Typography>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            variant="outlined"
            fullWidth
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            fullWidth
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Member'}
          </Button>
        </DialogActions>
      </Dialog>
      {totalPages > 1 && 
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            variant="outlined" 
            shape="rounded"
          />
        </Box>
      }
    </Box>
  );
};

export default PayrollTeamManagement;

