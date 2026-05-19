import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Chip,
  Radio,
  RadioGroup,
  Paper,
  Divider,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  useGetEmployeesQuery,
  useCreatePayoutMutation,
} from '../../../store/api/payrollApi';
import { useGetSettingsQuery } from '../../../store/api/payrollApi';
import { EmployeeListSkeleton } from '../../../components/ui/skeletons';
import { useMoneyFormatter } from '../../../hooks/useMoneyFormatter';

const PayrollCalculator = () => {
  const { currencySymbol } = useMoneyFormatter();
  const [calculationType, setCalculationType] = useState('project');
  const [projectTitle, setProjectTitle] = useState('');
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobTime, setJobTime] = useState({ hour: '12', minute: '00', period: 'PM' });
  const [isFirstTimeProject, setIsFirstTimeProject] = useState(false);
  const [quotedBy, setQuotedBy] = useState('');
  const [projectValue, setProjectValue] = useState('1000.00');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  // Get employees filtered by pay scale type based on calculation type
  const payScaleType = calculationType === 'hourly' ? 'hourly' : 'project';
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({ pay_scale_type: payScaleType, is_active: true });
  const { data: settingsData } = useGetSettingsQuery();
  const [createPayout, { isLoading: creating }] = useCreatePayoutMutation();

  const employees = employeesData?.results || [];
  const settings = settingsData?.[0];

  // Clear selected employees when calculation type changes
  useEffect(() => {
    setSelectedEmployees([]);
  }, [calculationType]);

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const calculatePayouts = async () => {
    setError(null);
    setSuccess(null);

    if (!projectTitle || selectedEmployees.length === 0) {
      setError('Please fill in all required fields and select at least one employee');
      return;
    }

    if (calculationType === 'project' && !projectValue) {
      setError('Please enter a project value');
      return;
    }

    if (calculationType === 'hourly' && (!startTime || !endTime)) {
      setError('Please enter start and end times');
      return;
    }

    try {
      let payload;
      
      if (calculationType === 'hourly') {
        // Get user_ids for selected employees
        const employeeUserIds = selectedEmployees
          .map(empId => {
            const emp = employees.find(e => e.id === empId);
            return emp?.user_id;
          })
          .filter(Boolean);

        payload = {
          type: 'hourly',
          employee_ids: employeeUserIds,
          job_date: jobDate,
          start_time: startTime,
          end_time: endTime,
          project_title: projectTitle,
        };
      } else {
        // Project-based calculation
        // Convert job time to ISO format
        const jobDateTime = new Date(`${jobDate}T${jobTime.hour}:${jobTime.minute}:00`);
        if (jobTime.period === 'PM' && jobTime.hour !== '12') {
          jobDateTime.setHours(jobDateTime.getHours() + 12);
        } else if (jobTime.period === 'AM' && jobTime.hour === '12') {
          jobDateTime.setHours(0);
        }

        // Get user_ids for selected employees
        const assigneeUserIds = selectedEmployees
          .map(empId => {
            const emp = employees.find(e => e.id === empId);
            return emp?.user_id;
          })
          .filter(Boolean);

        payload = {
          quoted_by_user_id: quotedBy || null,
          assignee_user_ids: assigneeUserIds,
          job_date_time: jobDateTime.toISOString(),
          project_title: projectTitle,
          is_first_time: isFirstTimeProject,
          project_value: parseFloat(projectValue),
        };
      }

      const result = await createPayout(payload).unwrap();
      
      setSuccess(`Successfully calculated ${selectedEmployees.length} payout(s)`);
      
      setTimeout(() => {
        setSuccess(null);
        setProjectTitle('');
        setSelectedEmployees([]);
        
        if (calculationType === 'hourly') {
          setStartTime('08:00');
          setEndTime('17:00');
        } else {
          setProjectValue('1000.00');
          setIsFirstTimeProject(false);
          setQuotedBy('');
        }
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to calculate payouts');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <Typography 
          variant="h4" 
          fontWeight={600}
          sx={{ 
            mb: 0.5,
          }}
        >
          Payroll Calculator
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '0.938rem' } }}
        >
          Calculate payouts for projects or hourly work
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Card 
        sx={{ 
          borderRadius: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderColor: 'divider',
        }}
      >
        <CardContent >
          <Stack spacing={{ xs: 3, sm: 3.5 }}>
            {/* Calculation Type */}
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  mb: 1, 
                  display: 'block', 
                  fontWeight: 600, 
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem'
                }}
              >
                Calculation Type
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={calculationType}
                  onChange={(e) => setCalculationType(e.target.value)}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="project">Project-based</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Project Details Section */}
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  mb: 2, 
                  display: 'block',
                  fontWeight: 600, 
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem'
                }}
              >
                Project Details
              </Typography>
              <Box display="flex" flexDirection={{xs: "column", md: "row"}} gap={{ xs: 2, sm: 2.5 }}>
                {/* Project Title */}
                <Grid item xs={12} md={8}>
                  <Typography 
                      variant="body2" 
                      sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}
                    >
                      Project Title
                    </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter project title"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      }
                    }}
                  />
                </Grid>

                {/* Job Date */}
                <Grid item xs={12} md={4}>
                  <Typography 
                      variant="body2" 
                      sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}
                    >
                      Job Date
                    </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={jobDate}
                    onChange={(e) => setJobDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      }
                    }}
                  />
                </Grid>

                {/* Job Time */}
                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ display: 'block', mb: 0.5, fontWeight: 500, color: 'text.secondary' }}
                  >
                    Job Time
                  </Typography>
                  <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={jobTime.hour}
                          onChange={(e) => setJobTime({ ...jobTime, hour: e.target.value })}
                          sx={{ borderRadius: 1 }}
                          inputProps={{ 'aria-label': 'Without label' }}
                          displayEmpty
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                            <MenuItem key={num} value={num.toString().padStart(2, '0')}>
                              {num}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={jobTime.minute}
                          onChange={(e) => setJobTime({ ...jobTime, minute: e.target.value })}
                          sx={{ borderRadius: 1 }}
                          inputProps={{ 'aria-label': 'Without label' }}
                          displayEmpty
                        >
                          <MenuItem value="00">00</MenuItem>
                          <MenuItem value="15">15</MenuItem>
                          <MenuItem value="30">30</MenuItem>
                          <MenuItem value="45">45</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={jobTime.period}
                          onChange={(e) => setJobTime({ ...jobTime, period: e.target.value })}
                          sx={{ borderRadius: 1 }}
                          inputProps={{ 'aria-label': 'Without label' }}
                          displayEmpty
                        >
                          <MenuItem value="AM">AM</MenuItem>
                          <MenuItem value="PM">PM</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                {calculationType === 'hourly' && (
                  <Grid item xs={12}>
                    <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                      {/* Start Time */}
                      <Grid item xs={12} sm={6}>
                        <Typography 
                          variant="body2" 
                          sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}
                        >
                          Start Time
                        </Typography>
                        <TextField
                          fullWidth
                          type="time"
                          size="small"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            }
                          }}
                        />
                      </Grid>

                      {/* End Time */}
                      <Grid item xs={12} sm={6}>
                        <Typography 
                          variant="body2" 
                          sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}
                        >
                          End Time
                        </Typography>
                        <TextField
                          fullWidth
                          type="time"
                          size="small"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {/* First Time Project Checkbox */}
                {calculationType === 'project' && (
                  <Box display="flex" alignItems="center" mt={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isFirstTimeProject}
                          onChange={(e) => setIsFirstTimeProject(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          First time project
                        </Typography>
                      }
                    />
                  </Box>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Quoted By Section */}
            {calculationType === 'project' && (
              <>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 2, 
                      display: 'block',
                      fontWeight: 600, 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.75rem'
                    }}
                  >
                    Quote Information
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quoted By</InputLabel>
                    <Select
                      value={quotedBy}
                      onChange={(e) => setQuotedBy(e.target.value)}
                      label="Quoted By"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="">
                        <em>Select who quoted</em>
                      </MenuItem>
                      {employeesData?.results?.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Divider />

                {/* Project Value */}
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 2, 
                      display: 'block',
                      fontWeight: 600, 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.75rem'
                    }}
                  >
                    Project Value
                  </Typography>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    size="small"
                    value={projectValue}
                    onChange={(e) => setProjectValue(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.secondary', fontWeight: 500 }}>
                          {currencySymbol}
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      }
                    }}
                  />
                </Box>
                <Divider />
              </>
            )}


            {/* Select Employees */}
            <Box mt={3}>
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                  }}
                >
                  Select Employees
                </Typography>

                <Chip
                  label={`${selectedEmployees.length} selected`}
                  size="small"
                  color={selectedEmployees.length > 0 ? "primary" : "default"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {/* Selected Chips */}
              {selectedEmployees.length > 0 && (
                <Box 
                  display="flex" 
                  flexWrap="wrap" 
                  gap={1} 
                  mb={2}
                  sx={{ maxHeight: 90, overflowY: "auto" }}
                >
                  {selectedEmployees.map((id) => {
                    const emp = employeesData.results.find((e) => e.id === id);
                    return (
                      <Chip
                        key={id}
                        label={emp?.full_name}
                        onDelete={() =>
                          setSelectedEmployees((prev) => prev.filter((x) => x !== id))
                        }
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              {/* Search */}
              <TextField
                size="small"
                fullWidth
                placeholder="Search employees..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Employee List */}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1,
                  maxHeight: 350,
                  overflowY: "auto",
                  background: "background.paper",
                }}
              >
                {isLoadingEmployees ? (
                  <EmployeeListSkeleton count={5} />
                ) : employees?.length === 0 ? (
                  <Typography
                    variant="body2"
                    textAlign="center"
                    color="text.secondary"
                    sx={{ p: 4 }}
                  >
                    No {calculationType === 'hourly' ? 'hourly' : 'project-based'} employees found
                  </Typography>
                ) : (
                  employees
                    ?.filter((emp) => {
                      // Filter by search term if provided
                      if (employeeSearch) {
                        const searchLower = employeeSearch.toLowerCase();
                        return (
                          emp.full_name?.toLowerCase().includes(searchLower) ||
                          emp.email?.toLowerCase().includes(searchLower)
                        );
                      }
                      return true;
                    })
                    .map((emp) => {
                      const isSelected = selectedEmployees.includes(emp.id);

                    return (
                      <Box
                        key={emp.id}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        p={1.2}
                        mb={1}
                        borderRadius={1}
                        sx={{
                          border: "1px solid",
                          borderColor: isSelected ? "primary.main" : "divider",
                          bgcolor: isSelected ? "primary.lighter" : "background.paper",
                          cursor: "pointer",
                          transition: "0.2s",
                          "&:hover": { borderColor: "primary.main" },
                        }}
                        onClick={() => {
                          setSelectedEmployees((prev) =>
                            prev.includes(emp.id)
                              ? prev.filter((x) => x !== emp.id)
                              : [...prev, emp.id]
                          );
                        }}
                      >
                        {/* Employee Info */}
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>{emp.full_name[0]}</Avatar>
                          <Box>
                            <Typography fontWeight={600} noWrap>
                              {emp.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {emp.pay_scale_type === "project"
                                ? `Project • ${emp.collaboration_rates?.[0]?.percentage || "N/A"}%`
                                : `${emp.hourly_rate}/hr`}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Tag */}
                        <Chip
                          label={isSelected ? "Selected" : "Add"}
                          color={isSelected ? "primary" : "default"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>


            {/* Calculate Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
              onClick={calculatePayouts}
              disabled={creating || selectedEmployees.length === 0}
              sx={{
                textTransform: 'none',
                fontWeight: 600,

                borderRadius: 1,
                fontSize: { xs: '0.938rem', sm: '1rem' },
                bgcolor: 'primary.main',
                boxShadow: 'none',
                mt: 1,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: 2,
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              {creating ? 'Calculating...' : 'Calculate Payouts'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayrollCalculator;