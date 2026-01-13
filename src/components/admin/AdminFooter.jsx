import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const AdminFooter = () => {
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
            <Typography
                variant="caption"
                display={"flex"}
                sx={{ fontSize: {xs:"0.5rem", md:"1rem"}, color: "text.secondary", alignItems: "center"}}
            >
                Powered by{" "}
                <a
                href="https://theservicepilot.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: "#023c8f",
                    textDecoration: "none",
                    fontWeight: 500,
                }}
                >
                <img
                    src="/servicepilot.jpg"
                    alt="Company Logo"
                    className="object-contain max-h-[20px] md:max-h-[40px]"
                    style={{
                    objectFit: "contain",
                    }}
                />
                </a>
            </Typography>
        </div>
      </Container>
    </Box>
  );
};

export default AdminFooter;