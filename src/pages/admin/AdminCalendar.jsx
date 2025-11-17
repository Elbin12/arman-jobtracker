import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import AdminCalendarView from '../../components/admin/calendar/AdminCalendarView.jsx';

const AdminCalendar = () => {
  const events = useMemo(() => ([
    { id: 'e1', jobId: 101, title: 'Deep Clean - 3BR', date: '2025-11-05', time: '10:00', status: 'SCHEDULED' },
    { id: 'e2', jobId: 103, title: 'Office Clean', date: '2025-11-06', time: '09:00', status: 'IN_PROGRESS' },
    { id: 'e3', jobId: 104, title: 'Post-Reno Clean', date: '2025-11-04', time: '15:00', status: 'COMPLETED' },
  ]), []);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Calendar</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Scheduled jobs grouped by day.</Typography>
      <AdminCalendarView events={events} />
    </Box>
  );
};

export default AdminCalendar;


