import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PeopleAlt as PeopleIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../../store/api/payrollApi';
import PayrollTeamManagement from './PayrollTeamManagement';

const PayrollSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { data: settingsData, isLoading: settingsLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: updating }] = useUpdateSettingsMutation();
  
  const [firstTimeBonus, setFirstTimeBonus] = useState('');
  const [quotedByBonus, setQuotedByBonus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  React.useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const settings = settingsData[0];
      setFirstTimeBonus(settings.first_time_bonus_percentage || '');
      setQuotedByBonus(settings.quoted_by_bonus_percentage || '');
    }
  }, [settingsData]);

  const handleUpdateFirstTimeBonus = async () => {
    if (!settingsData || settingsData.length === 0) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      await updateSettings({
        id: settingsData[0].id,
        first_time_bonus_percentage: parseFloat(firstTimeBonus),
      }).unwrap();
      setSuccess('First Time Project Bonus updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.data?.detail || 'Failed to update settings');
    }
  };

  const handleUpdateQuotedByBonus = async () => {
    if (!settingsData || settingsData.length === 0) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      await updateSettings({
        id: settingsData[0].id,
        quoted_by_bonus_percentage: parseFloat(quotedByBonus),
      }).unwrap();
      setSuccess('Quoted By Bonus updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.data?.detail || 'Failed to update settings');
    }
  };

  if (settingsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <SettingsIcon sx={{ fontSize: 32, color: 'hsl(var(--primary))' }} />
          <Typography variant="h4" fontWeight={600}>
            Settings
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage your team and application settings
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Team Management"
          />
          <Tab
            icon={<PercentIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="% Payroll Settings"
          />
        </Tabs>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tab Content */}
      {activeTab === 0 && <PayrollTeamManagement />}

      {activeTab === 1 && (
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} mb={1}>
              % Payroll Bonus Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Configure bonus percentages for different project scenarios
            </Typography>

            <Grid container spacing={4}>
              {/* First Time Project Bonus */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    First Time Project Bonus
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" fontWeight={500} mb={1}>
                      Percentage (%)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={firstTimeBonus}
                      onChange={(e) => setFirstTimeBonus(e.target.value)}
                      placeholder="15"
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleUpdateFirstTimeBonus}
                      disabled={updating || !firstTimeBonus}
                      sx={{
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: 'hsl(var(--primary) / 0.9)',
                        },
                      }}
                    >
                      {updating ? <CircularProgress size={20} /> : 'Update'}
                    </Button>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Bonus for the quoted-by employee on first-time projects: {firstTimeBonus || settingsData?.[0]?.first_time_bonus_percentage || 0}%
                  </Typography>
                </Box>
              </Grid>

              {/* Quoted By Bonus (Regular Projects) */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Quoted By Bonus (Regular Projects)
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" fontWeight={500} mb={1}>
                      Percentage (%)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={quotedByBonus}
                      onChange={(e) => setQuotedByBonus(e.target.value)}
                      placeholder="2"
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleUpdateQuotedByBonus}
                      disabled={updating || !quotedByBonus}
                      sx={{
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: 'hsl(var(--primary) / 0.9)',
                        },
                      }}
                    >
                      {updating ? <CircularProgress size={20} /> : 'Update'}
                    </Button>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Bonus for the quoted-by employee on regular (non-first-time) projects: {quotedByBonus || settingsData?.[0]?.quoted_by_bonus_percentage || 0}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PayrollSettings;



