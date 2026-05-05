import React from 'react';
import { Paper, alpha, useTheme } from '@mui/material';

export function ContactPickRow({ active, onClick, children }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.5,
        mb: 1,
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: active ? 'primary.main' : 'grey.200',
        borderLeftWidth: 4,
        borderLeftColor: active ? 'primary.main' : 'transparent',
        bgcolor: active ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
        boxShadow: 'none',
        transition: 'background-color 0.12s ease, border-color 0.12s ease',
        '&:hover': {
          bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : 'grey.50',
          borderColor: active ? 'primary.main' : 'grey.300',
        },
      }}
    >
      {children}
    </Paper>
  );
}
