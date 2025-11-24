import React, { useState } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CreateJobForm } from '../../components/admin/jobs/CreateJob.jsx';

const CreateJob = () => {
  const [form, setForm] = useState({ title: '', customer: '', status: 'NEW' });

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Create Job</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Create and schedule a new job.</Typography>
      <Card>
        <CardContent>
          <CreateJobForm value={form} onChange={setForm} onSubmit={() => {}} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateJob;


