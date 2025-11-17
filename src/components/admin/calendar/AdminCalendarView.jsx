import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Chip } from '@mui/material';

// Simple grouped-by-date calendar list (backend/calendar lib can replace later)
export const AdminCalendarView = ({ events = [], onSelect }) => {
  const groups = events.reduce((acc, e) => {
    const d = (e.date || '').slice(0, 10);
    acc[d] = acc[d] || [];
    acc[d].push(e);
    return acc;
  }, {});

  const orderedDates = Object.keys(groups).sort();

  return (
    <Grid container spacing={2}>
      {orderedDates.map(date => (
        <Grid item xs={12} md={6} key={date}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>{date}</Typography>
              {groups[date].map(ev => (
                <Box key={ev.id} display="flex" alignItems="center" justifyContent="space-between" py={1}>
                  <Box>
                    <Typography variant="body1">{ev.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{ev.time || ''} • #{ev.jobId}</Typography>
                  </Box>
                  <Chip size="small" label={ev.status} onClick={() => onSelect?.(ev)} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AdminCalendarView;


