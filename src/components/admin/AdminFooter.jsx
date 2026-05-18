import React from 'react';
import { Box, Container } from '@mui/material';
import PoweredBy, { useShouldShowPoweredBy } from '../PoweredBy';

const AdminFooter = () => {
  const showPoweredBy = useShouldShowPoweredBy();
  if (!showPoweredBy) return null;

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <div className="justify-self-center">
          <PoweredBy />
        </div>
      </Container>
    </Box>
  );
};

export default AdminFooter;
