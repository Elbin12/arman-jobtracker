import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CreateJobForm } from '../../components/admin/jobs/CreateJob.jsx';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AdminProtectedRoute from '../AdminProtectedRoute';

const CalendarCreateJob = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to calendar after successful job creation
    navigate('/admin/calendar');
  };

  const handleCancel = () => {
    // Navigate back to calendar on cancel
    navigate('/admin/calendar');
  };

  return (
    <AdminProtectedRoute>
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Minimal Header */}
        <Box sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: { xs: 2, sm: 4 },
          py: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            maxWidth: '1200px',
            mx: 'auto'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/calendar')}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Calendar
              </Button>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Create Job
            </Typography>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          flex: 1,
          px: { xs: 2, sm: 4 },
          py: 4,
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto'
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 600,
              mb: 1
            }}
          >
            Create Job
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            mb={3}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Create and schedule a new job.
          </Typography>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <CreateJobForm 
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </AdminProtectedRoute>
  );
};

export default CalendarCreateJob;

