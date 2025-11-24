import React from 'react';
import { Box, Typography } from '@mui/material';
import { NewCalendar } from '../../components/admin/calendar/Calendar.jsx';
import { useGetAssigneesQuery } from '../../store/api/assigneesApi.js';
import { useGetCalendarJobsQuery } from '../../store/api/jobsApi.js';

const AdminCalendar = () => {
  const { data: assigneesData, isLoading: assigneesLoading } = useGetAssigneesQuery()

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Calendar</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Scheduled jobs grouped by day.</Typography>
      <NewCalendar users={assigneesData?.results} />
    </Box>
  );
};

export default AdminCalendar;


