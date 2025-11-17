import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField } from '@mui/material';

export const AssigneeFormDialog = ({ open, onClose, value = {}, onChange, onSave }) => {
  const v = value || {};
  const set = (k, val) => onChange({ ...v, [k]: val });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{v.id ? 'Edit Assignee' : 'Add Assignee'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Name" value={v.name || ''} onChange={(e) => set('name', e.target.value)} />
          <TextField label="Email" value={v.email || ''} onChange={(e) => set('email', e.target.value)} />
          <TextField label="Default %" type="number" value={v.defaultPercentage || ''} onChange={(e) => set('defaultPercentage', Number(e.target.value))} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssigneeFormDialog;


