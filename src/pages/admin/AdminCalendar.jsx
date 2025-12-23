import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { NewCalendar } from '../../components/admin/calendar/Calendar.jsx';
import { useGetEmployeesQuery } from '../../store/api/payrollApi.js';
import { useGetCalendarJobsQuery } from '../../store/api/jobsApi.js';

const AdminCalendar = () => {
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role || "worker";
  
  // Only fetch users if user is admin, manager, or supervisor
  const canViewStaff = ["admin", "manager", "supervisor"].includes(userRole);
  
  const { data: assigneesData, isLoading: assigneesLoading } = useGetEmployeesQuery(
    { is_active: true,},
    { skip: !canViewStaff }
  );

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontWeight: 600
        }}
      >
        Calendar
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        mb={2}
        sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          display: { xs: 'none', sm: 'block' }
        }}
      >
        Scheduled jobs grouped by day.
      </Typography>
      <NewCalendar 
        users={canViewStaff ? (assigneesData?.results || []) : []} 
        isLoadingUsers={canViewStaff ? assigneesLoading : false} 
      />
    </Box>
  );
};

export default AdminCalendar;


