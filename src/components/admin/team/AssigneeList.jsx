import React from 'react';
import { Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Typography } from '@mui/material';
import { Edit } from '@mui/icons-material';

export const AssigneeList = ({ items = [], onEdit }) => {
  return (
    <Card>
      <CardContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Default %</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={4}><Typography variant="body2" color="text.secondary">No team members</Typography></TableCell></TableRow>
            )}
            {items.map(a => (
              <TableRow key={a.id} hover>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.defaultPercentage ?? '-'}%</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onEdit?.(a)}><Edit fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AssigneeList;


