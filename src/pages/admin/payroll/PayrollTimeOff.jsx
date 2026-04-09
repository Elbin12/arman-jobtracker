import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import TimeOffSection from '../../../components/admin/payroll/TimeOffSection';

const PayrollTimeOff = () => {
  const user = useSelector((state) => state.auth.user);
  const normalizedRole = String(user?.role ?? 'worker').toLowerCase();
  const isManagerOrSupervisor = ['admin', 'manager', 'supervisor'].includes(normalizedRole);
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={700}
          color="#0f172a"
          sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }, mb: 0.5 }}
        >
          Time off
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
          {getCurrentDate()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
          {isManagerOrSupervisor
            ? 'Record scheduled absence for any team member and review entries for the selected date range.'
            : 'Submit planned time away; your team can see entries in payroll.'}
        </Typography>
      </Box>

      <TimeOffSection hideHero />
    </Box>
  );
};

export default PayrollTimeOff;
