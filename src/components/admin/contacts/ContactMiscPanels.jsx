import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Person from '@mui/icons-material/Person';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import { downloadInvoicePdf } from '../../../utils/invoicePdf';

const money = (v, currency = 'USD') => {
  if (v == null || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
};

function When({ iso }) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function Field({ label, children }) {
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {children ?? '—'}
      </Typography>
    </Box>
  );
}

export function ContactQuotePanel({ submission }) {
  if (!submission) return null;
  return (
    <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Quote
          </Typography>
          <Chip size="small" label={submission.status || '—'} variant="outlined" sx={{ textTransform: 'capitalize' }} />
        </Box>
        <Field label="Final total">{money(submission.final_total)}</Field>
        <Field label="Location">{submission.location_name || '—'}</Field>
        <Field label="Quoted by">
          {submission.quoted_by?.full_name || submission.quoted_by?.username || '—'}
        </Field>
        <Field label="Updated">
          <When iso={submission.updated_at} />
        </Field>
        {submission.house_sqft != null && <Field label="House (sq ft)">{String(submission.house_sqft)}</Field>}
        <Divider sx={{ my: 2 }} />
        <Button
          component={RouterLink}
          to={`/quote/details/${submission.id}`}
          variant="contained"
          size="medium"
          endIcon={<OpenInNew />}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Open full quote
        </Button>
      </CardContent>
    </Card>
  );
}

export function ContactInvoicePanel({ invoice, contact, billToAddress }) {
  const [busy, setBusy] = useState(false);

  if (!invoice) return null;

  const handlePdf = async () => {
    setBusy(true);
    try {
      await downloadInvoicePdf(invoice, contact || null, billToAddress || null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {invoice.invoice_number || invoice.invoice_id || 'Invoice'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip size="small" label={invoice.status || '—'} variant="outlined" />
            {invoice.is_overdue && <Chip size="small" label="Overdue" color="error" />}
          </Box>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            size="medium"
            startIcon={<PictureAsPdf />}
            disabled={busy}
            onClick={handlePdf}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {busy ? 'Preparing…' : 'Download Invoice'}
          </Button>
        </Stack>
        <Field label="Total">{money(invoice.total, invoice.currency)}</Field>
        <Field label="Amount paid">{money(invoice.amount_paid, invoice.currency)}</Field>
        <Field label="Balance due">{money(invoice.amount_due, invoice.currency)}</Field>
        <Field label="Issue date">
          <When iso={invoice.issue_date} />
        </Field>
        <Field label="Due date">
          <When iso={invoice.due_date} />
        </Field>
      </CardContent>
    </Card>
  );
}

export function ContactAppointmentPanel({ appt }) {
  if (!appt) return null;
  const addressLink = appt.address && /^https?:\/\//i.test(appt.address) ? appt.address : null;
  return (
    <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
      <CardContent sx={{ p: 0 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {appt.title || 'Appointment'}
        </Typography>
        <Chip size="small" label={appt.appointment_status || '—'} sx={{ mb: 1.5, textTransform: 'capitalize' }} />
        <Field label="Start">
          <When iso={appt.start_time} />
        </Field>
        <Field label="End">
          <When iso={appt.end_time} />
        </Field>
        <Field label="Calendar">{appt.calendar_name || '—'}</Field>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.75 }}>
          <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              Assigned
            </Typography>
            <Typography variant="body2">
              {appt.assigned_user?.full_name || appt.assigned_user?.username || '—'}
            </Typography>
          </Box>
        </Box>
        {appt.notes && <Field label="Notes">{appt.notes}</Field>}
        {addressLink && (
          <Button href={addressLink} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew />} sx={{ mt: 1 }}>
            Open linked address
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ContactAddressPanel({ addr }) {
  if (!addr) return null;
  return (
    <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
      <CardContent sx={{ p: 0 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {addr.name || 'Address'}
        </Typography>
        <Field label="Street">{addr.street_address}</Field>
        <Field label="City / State / ZIP">
          {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ') || '—'}
        </Field>
        {addr.full_address && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              FULL LINE
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {addr.full_address}
            </Typography>
          </>
        )}
        {(addr.property_type || addr.property_sqft || addr.number_of_floors || addr.gate_code) && (
          <>
            <Divider sx={{ my: 1.5 }} />
            {addr.property_type && <Field label="Property type">{addr.property_type}</Field>}
            {addr.property_sqft != null && <Field label="Sq ft">{String(addr.property_sqft)}</Field>}
            {addr.number_of_floors != null && <Field label="Floors">{String(addr.number_of_floors)}</Field>}
            {addr.gate_code != null && <Field label="Gate code">{addr.gate_code}</Field>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
