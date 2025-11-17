import React from 'react';
import { Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import AcceptedQuote from './AcceptedQuote';

export const AcceptedQuotesList = ({ items = [], onOpen }) => {
  return (
    <Card>
      <CardContent>
        {items.map(q => (
          <AcceptedQuote quote={q}/>
        ))}
      </CardContent>
    </Card>
  );
};

export default AcceptedQuotesList;


