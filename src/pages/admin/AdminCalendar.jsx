import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { NewCalendar } from '../../components/admin/calendar/Calendar.jsx';
import { useGetAssigneesQuery } from '../../store/api/assigneesApi.js';
import { useGetCalendarJobsQuery } from '../../store/api/jobsApi.js';

const AdminCalendar = () => {
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role || "worker";
  
  // Only fetch users if user is admin, manager, or supervisor
  const canViewStaff = ["admin", "manager", "supervisor"].includes(userRole);
  
  const { data: assigneesData, isLoading: assigneesLoading } = useGetAssigneesQuery(
    undefined,
    { skip: !canViewStaff }
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Calendar</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Scheduled jobs grouped by day.</Typography>
      <NewCalendar 
        users={canViewStaff ? (assigneesData?.results || []) : []} 
        isLoadingUsers={canViewStaff ? assigneesLoading : false} 
      />
    </Box>
  );
};

export default AdminCalendar;


