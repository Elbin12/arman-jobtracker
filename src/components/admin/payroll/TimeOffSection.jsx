import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  alpha,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  EventBusy as EventBusyIcon,
  BeachAccess as VacationIcon,
  LocalHospital as SickIcon,
  Person as PersonIcon,
  MoreHoriz as OtherIcon,
  Weekend as DayOffIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import {
  useGetEmployeesQuery,
  useGetTimeOffListQuery,
  useCreateTimeOffMutation,
  useUpdateTimeOffMutation,
} from '../../../store/api/payrollApi';
import { useToast } from '@/hooks/use-toast';

/** Matches payroll sub-nav bar (AdminLayout) */
const PAYROLL_NAVY = '#073D7F';

const KIND_OPTIONS = [
  { value: 'day_off', label: 'Day off' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const kindMeta = {
  day_off: { label: 'Day off', color: '#64748b', Icon: DayOffIcon },
  vacation: { label: 'Vacation', color: '#8b5cf6', Icon: VacationIcon },
  sick: { label: 'Sick', color: '#ef4444', Icon: SickIcon },
  personal: { label: 'Personal', color: PAYROLL_NAVY, Icon: PersonIcon },
  other: { label: 'Other', color: '#94a3b8', Icon: OtherIcon },
};

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange() {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  return { from_date: formatYmd(from), to_date: formatYmd(to) };
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDisplayDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Stable key for Select value + API `employee` (payroll row id, pk, or user link). */
function getEmployeeOptionKey(emp) {
  const v = emp?.user_id;
  if (v == null || v === '') return null;
  return String(v);
}

/** Value sent as JSON `employee` (integer id or UUID string). */
function toApiEmployeePayload(emp) {
  const raw = emp?.user_id;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

/**
 * @param {{ requireEmployeeSelection: boolean, employees: object[], employeeSelectKey: string, kind: string, start: string, end: string, notes: string }} args
 * @returns {{ ok: true, body: object } | { ok: false, title: string, description: string }}
 */
function buildTimeOffRequestBody({
  requireEmployeeSelection,
  employees,
  employeeSelectKey,
  kind,
  start,
  end,
  notes,
}) {
  if (start > end) {
    return {
      ok: false,
      title: 'Invalid dates',
      description: 'End date must be on or after start date.',
    };
  }
  const body = {
    start_date: start,
    end_date: end,
    kind,
  };
  const trimmedNotes = (notes ?? '').trim();
  if (trimmedNotes) body.notes = trimmedNotes;

  if (requireEmployeeSelection) {
    const key = String(employeeSelectKey ?? '').trim();
    if (!key) {
      return {
        ok: false,
        title: 'Select an employee',
        description: 'Choose who this time off applies to.',
      };
    }
    const selected = employees.find((e) => getEmployeeOptionKey(e) === key);
    const apiEmployee = selected ? toApiEmployeePayload(selected) : null;
    const invalidNumeric =
      typeof apiEmployee === 'number' && (!Number.isFinite(apiEmployee) || apiEmployee < 1);
    if (!selected || apiEmployee == null || invalidNumeric) {
      return {
        ok: false,
        title: 'Select an employee',
        description:
          selected && apiEmployee == null
            ? 'This team member is missing a valid id in payroll data. Try refreshing the page.'
            : 'Choose who this time off applies to.',
      };
    }
    body.employee = apiEmployee;
  }
  return { ok: true, body };
}

/** Update payload only — employee stays fixed on the server (standard for PTO / absence edits). */
function buildTimeOffUpdateBody({ kind, start, end, notes }) {
  if (start > end) {
    return {
      ok: false,
      title: 'Invalid dates',
      description: 'End date must be on or after start date.',
    };
  }
  const body = {
    start_date: start,
    end_date: end,
    kind,
  };
  const trimmedNotes = (notes ?? '').trim();
  if (trimmedNotes) body.notes = trimmedNotes;
  return { ok: true, body };
}

function formatTimeOffApiError(err) {
  const d = err?.data;
  let msg =
    (typeof d === 'string' && d) ||
    d?.detail ||
    d?.message ||
    'Could not save time off. Please try again.';
  if (d && typeof d === 'object' && !d.detail && !d.message) {
    const parts = Object.entries(d).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => `${k}: ${x}`) : [`${k}: ${v}`]
    );
    if (parts.length) msg = parts.join(' ');
  }
  return Array.isArray(msg) ? msg.join(' ') : String(msg);
}

/**
 * @param {{ hideHero?: boolean }} props — hideHero: omit inner title band when the page already has a heading (e.g. Time Off tab).
 */
const TimeOffSection = ({ hideHero = false }) => {
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user);
  const user_profile = useSelector((state) => state.auth.user_profile);

  const normalizedRole = String(user?.role ?? 'worker').toLowerCase();
  const isManagerOrSupervisor = ['admin', 'manager', 'supervisor'].includes(normalizedRole);
  /** Who may add/edit entries: role admin/manager/supervisor (same as payroll elsewhere), or `is_admin` from auth login. */
  const canManageTimeOff = isManagerOrSupervisor || Boolean(user?.is_admin);

  const [listRange, setListRange] = useState(() => defaultRange());
  const [formEmployee, setFormEmployee] = useState('');
  const [formKind, setFormKind] = useState('vacation');
  const [formStart, setFormStart] = useState(() => formatYmd(new Date()));
  const [formEnd, setFormEnd] = useState(() => formatYmd(new Date()));
  const [formNotes, setFormNotes] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  /** Read-only employee line in edit dialog; set from the row being edited. */
  const [editEmployeeDisplay, setEditEmployeeDisplay] = useState(null);
  const [editKind, setEditKind] = useState('vacation');
  const [editStart, setEditStart] = useState(() => formatYmd(new Date()));
  const [editEnd, setEditEnd] = useState(() => formatYmd(new Date()));
  const [editNotes, setEditNotes] = useState('');

  const { data: employeesData } = useGetEmployeesQuery({ is_active: true }, { skip: !canManageTimeOff });
  const employees = employeesData?.results || [];

  const listParams = useMemo(
    () => ({
      from_date: listRange.from_date,
      to_date: listRange.to_date,
    }),
    [listRange.from_date, listRange.to_date]
  );

  const rangeInvalid = listRange.from_date > listRange.to_date;

  const { data: timeOffData, isFetching: listLoading } = useGetTimeOffListQuery(listParams, {
    skip: rangeInvalid,
  });
  const [createTimeOff, { isLoading: creating }] = useCreateTimeOffMutation();
  const [updateTimeOff, { isLoading: updating }] = useUpdateTimeOffMutation();

  const results = rangeInvalid ? [] : timeOffData?.results || [];
  const totalCount = rangeInvalid ? 0 : timeOffData?.count ?? results.length;

  const closeEditDialog = () => {
    setEditOpen(false);
    setEditingId(null);
    setEditEmployeeDisplay(null);
    setEditNotes('');
  };

  const openEditDialog = (row) => {
    if (!canManageTimeOff || row?.id == null) return;
    setEditingId(row.id);
    setEditEmployeeDisplay({
      name: row.employee_name || 'Employee',
      email: row.employee_email || '',
    });
    const validKinds = new Set(KIND_OPTIONS.map((o) => o.value));
    setEditKind(validKinds.has(row.kind) ? row.kind : 'other');
    setEditStart(row.start_date || formatYmd(new Date()));
    setEditEnd(row.end_date || row.start_date || formatYmd(new Date()));
    setEditNotes(row.notes || '');
    setEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageTimeOff) {
      toast({
        variant: 'destructive',
        title: 'Not allowed',
        description: 'Only a manager, supervisor, or administrator can add time off.',
      });
      return;
    }
    const built = buildTimeOffRequestBody({
      requireEmployeeSelection: true,
      employees,
      employeeSelectKey: formEmployee,
      kind: formKind,
      start: formStart,
      end: formEnd,
      notes: formNotes,
    });
    if (!built.ok) {
      toast({ variant: 'destructive', title: built.title, description: built.description });
      return;
    }

    try {
      await createTimeOff(built.body).unwrap();
      toast({
        title: 'Time off recorded',
        description: 'The entry has been added for the selected employee.',
      });
      setFormNotes('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: formatTimeOffApiError(err),
      });
    }
  };

  const handleEditSave = async () => {
    if (!canManageTimeOff || editingId == null) return;
    const built = buildTimeOffUpdateBody({
      kind: editKind,
      start: editStart,
      end: editEnd,
      notes: editNotes,
    });
    if (!built.ok) {
      toast({ variant: 'destructive', title: built.title, description: built.description });
      return;
    }

    try {
      await updateTimeOff({ id: editingId, ...built.body }).unwrap();
      toast({
        title: 'Time off updated',
        description: 'Your changes have been saved.',
      });
      closeEditDialog();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: formatTimeOffApiError(err),
      });
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {!hideHero && (
          <Box
            sx={{
              px: { xs: 2.5, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              borderBottom: '1px solid',
              borderColor: 'divider',
              background: `linear-gradient(135deg, ${alpha(PAYROLL_NAVY, 0.08)} 0%, rgba(255,255,255,0) 60%)`,
            }}
          >
            <Box display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(PAYROLL_NAVY, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <EventBusyIcon sx={{ fontSize: 26, color: PAYROLL_NAVY }} />
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography variant="h5" fontWeight={700} color="#0f172a" sx={{ fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
                  Time off
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                  {canManageTimeOff
                    ? 'Record or update scheduled absence for any team member. Entries appear in the list below for the selected date range.'
                    : 'Your scheduled time off appears below. Only a manager, supervisor, or administrator can add or change entries.'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
          {canManageTimeOff ? (
            <>
              <Typography variant="subtitle1" fontWeight={600} color="#0f172a" sx={{ mb: 2 }}>
                Add time off
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel id="timeoff-employee-label" shrink>
                          Employee
                        </InputLabel>
                        <Select
                          labelId="timeoff-employee-label"
                          value={formEmployee}
                          label="Employee"
                          displayEmpty
                          onChange={(e) =>
                            setFormEmployee(String(e.target.value ?? ''))
                          }
                          inputProps={{ autoComplete: 'off' }}
                          renderValue={(selected) => {
                            if (!selected) {
                              return (
                                <Typography component="span" color="text.secondary">
                                  Select employee
                                </Typography>
                              );
                            }
                            const emp = employees.find(
                              (e) => getEmployeeOptionKey(e) === String(selected)
                            );
                            if (!emp) {
                              return String(selected);
                            }
                            return (
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar
                                  sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                                >
                                  {getInitials(emp.full_name)}
                                </Avatar>
                                {emp.full_name}
                              </Box>
                            );
                          }}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">
                            <em>Select employee</em>
                          </MenuItem>
                          {employees.map((emp) => {
                            const optKey = getEmployeeOptionKey(emp);
                            if (!optKey) return null;
                            return (
                              <MenuItem key={optKey} value={optKey}>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <Avatar
                                    sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                                  >
                                    {getInitials(emp.full_name)}
                                  </Avatar>
                                  {emp.full_name}
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                      <FormControl fullWidth>
                        <InputLabel id="timeoff-kind-label">Type</InputLabel>
                        <Select
                          labelId="timeoff-kind-label"
                          value={formKind}
                          label="Type"
                          onChange={(e) => setFormKind(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          {KIND_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Start date"
                        value={formStart}
                        onChange={(e) => setFormStart(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        type="date"
                        label="End date"
                        value={formEnd}
                        onChange={(e) => setFormEnd(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes (optional)"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="e.g. Approved PTO, doctor appointment…"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={creating}
                    startIcon={creating ? <CircularProgress size={20} color="inherit" /> : null}
                    sx={{
                      alignSelf: { xs: 'stretch', sm: 'flex-start' },
                      bgcolor: PAYROLL_NAVY,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.25,
                      borderRadius: 2,
                      boxShadow: `0 4px 12px ${alpha(PAYROLL_NAVY, 0.35)}`,
                      '&:hover': {
                        bgcolor: '#062e63',
                        boxShadow: `0 6px 16px ${alpha(PAYROLL_NAVY, 0.4)}`,
                      },
                    }}
                  >
                    {creating ? 'Saving…' : 'Record time off'}
                  </Button>
                </Stack>
              </Box>
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                View only
              </Typography>
              <Typography variant="body2">
                Adding or editing time off is limited to managers, supervisors, and administrators. Contact your
                manager if a schedule change is needed.
              </Typography>
            </Alert>
          )}
        </Box>

        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fafbfc',
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'flex-end' }}
            justifyContent="space-between"
            gap={2}
            mb={2}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="#0f172a">
                Scheduled time off
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {totalCount} {totalCount === 1 ? 'entry' : 'entries'} in range
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                type="date"
                label="From"
                value={listRange.from_date}
                onChange={(e) => setListRange((r) => ({ ...r, from_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={listRange.to_date}
                onChange={(e) => setListRange((r) => ({ ...r, to_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
              />
            </Stack>
          </Box>

          {rangeInvalid && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              From date must be on or before the To date to load entries.
            </Alert>
          )}

          {listLoading && !rangeInvalid ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={36} sx={{ color: PAYROLL_NAVY }} />
            </Box>
          ) : results.length === 0 ? (
            <Box textAlign="center" py={6} px={2}>
              <EventBusyIcon sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={600} color="#64748b">
                No time off in this range
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {canManageTimeOff
                  ? 'Adjust the dates above or add a new entry.'
                  : 'Adjust the date range above. Ask an administrator to add or update entries.'}
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                        {isManagerOrSupervisor && (
                          <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8125rem' }}>Employee</TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8125rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8125rem' }}>Start</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8125rem' }}>End</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8125rem' }}>Notes</TableCell>
                        {canManageTimeOff && (
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8125rem', width: 72 }}
                          >
                            Actions
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((row) => {
                        const meta = kindMeta[row.kind] || kindMeta.other;
                        const KindIcon = meta.Icon;
                        const rowKey = row.id ?? `row-${row.start_date}-${row.end_date}-${row.employee}`;
                        return (
                          <TableRow key={rowKey} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            {isManagerOrSupervisor && (
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', bgcolor: PAYROLL_NAVY }}>
                                    {getInitials(row.employee_name)}
                                  </Avatar>
                                  <Box minWidth={0}>
                                    <Typography variant="body2" fontWeight={600} color="#0f172a" noWrap>
                                      {row.employee_name}
                                    </Typography>
                                    {row.employee_email && (
                                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                                        {row.employee_email}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip
                                icon={<KindIcon sx={{ fontSize: '16px !important' }} />}
                                label={meta.label}
                                size="small"
                                sx={{
                                  bgcolor: alpha(meta.color, 0.1),
                                  color: meta.color,
                                  fontWeight: 600,
                                  border: `1px solid ${alpha(meta.color, 0.25)}`,
                                  '& .MuiChip-icon': { color: meta.color },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {formatDisplayDate(row.start_date)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {formatDisplayDate(row.end_date)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 280 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                                {row.notes || '—'}
                              </Typography>
                            </TableCell>
                            {canManageTimeOff && (
                              <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                                {row.id != null ? (
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      aria-label={`Edit time off for ${row.employee_name || 'employee'}`}
                                      onClick={() => openEditDialog(row)}
                                      sx={{
                                        color: PAYROLL_NAVY,
                                        '&:hover': { bgcolor: alpha(PAYROLL_NAVY, 0.08) },
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : null}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                {results.map((row) => {
                  const meta = kindMeta[row.kind] || kindMeta.other;
                  const KindIcon = meta.Icon;
                  const rowKey = row.id ?? `card-${row.start_date}-${row.end_date}-${row.employee}`;
                  return (
                    <Paper
                      key={rowKey}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeft: `4px solid ${meta.color}`,
                        bgcolor: 'white',
                        position: 'relative',
                      }}
                    >
                      {canManageTimeOff && row.id != null && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label="Edit time off"
                            onClick={() => openEditDialog(row)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              color: PAYROLL_NAVY,
                              '&:hover': { bgcolor: alpha(PAYROLL_NAVY, 0.08) },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isManagerOrSupervisor && (
                        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                          <Avatar sx={{ width: 40, height: 40, fontSize: '0.8rem', bgcolor: PAYROLL_NAVY }}>
                            {getInitials(row.employee_name)}
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="body2" fontWeight={600} color="#0f172a">
                              {row.employee_name}
                            </Typography>
                            {row.employee_email && (
                              <Typography variant="caption" color="text.secondary">
                                {row.employee_email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      <Chip
                        icon={<KindIcon sx={{ fontSize: '16px !important' }} />}
                        label={meta.label}
                        size="small"
                        sx={{
                          mb: 1.5,
                          bgcolor: alpha(meta.color, 0.1),
                          color: meta.color,
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: meta.color },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDisplayDate(row.start_date)} → {formatDisplayDate(row.end_date)}
                      </Typography>
                      {row.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {row.notes}
                        </Typography>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </>
          )}
        </Box>

        <Dialog
          open={editOpen}
          onClose={() => {
            if (!updating) closeEditDialog();
          }}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: '#0f172a', pb: 1 }}>Edit time off</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar sx={{ width: 44, height: 44, bgcolor: PAYROLL_NAVY, fontSize: '1rem' }}>
                      {getInitials(editEmployeeDisplay?.name)}
                    </Avatar>
                    <Box minWidth={0}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Employee
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="#0f172a" noWrap>
                        {editEmployeeDisplay?.name || 'Employee'}
                      </Typography>
                      {editEmployeeDisplay?.email ? (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {editEmployeeDisplay.email}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="timeoff-edit-kind-label">Type</InputLabel>
                    <Select
                      labelId="timeoff-edit-kind-label"
                      value={editKind}
                      label="Type"
                      onChange={(e) => setEditKind(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      {KIND_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes (optional)"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Approved PTO, doctor appointment…"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
            <Button onClick={closeEditDialog} disabled={updating} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              disabled={updating}
              startIcon={updating ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: PAYROLL_NAVY,
                borderRadius: 2,
                px: 2.5,
                '&:hover': { bgcolor: '#062e63' },
              }}
            >
              {updating ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TimeOffSection;
