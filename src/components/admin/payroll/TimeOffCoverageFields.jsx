import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Grid,
} from '@mui/material';
import {
  COVERAGE_OPTIONS,
  COVERAGE_CUSTOM,
  isSingleDayRange,
} from './timeOffCoverage';

const selectSx = {
  borderRadius: 1.5,
  fontSize: '0.875rem',
  '& .MuiSelect-select': { py: 0.875 },
};

function formatShortDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function CoverageDayControl({ dayLabel, dateYmd, value, onChange, startTime, endTime, onStart, onEnd }) {
  const showTimes = value === COVERAGE_CUSTOM;
  const heading = dateYmd ? `${dayLabel} · ${formatShortDate(dateYmd)}` : dayLabel;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={600}
          color="#475569"
          sx={{ minWidth: { xs: '100%', sm: 88 }, flexShrink: 0 }}
        >
          {heading}
        </Typography>
        <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
          <Select value={value} onChange={(e) => onChange(e.target.value)} sx={selectSx} displayEmpty={false}>
            {COVERAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} dense>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {showTimes && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <TextField
              size="small"
              type="time"
              label="From"
              value={startTime}
              onChange={(e) => onStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              sx={{
                width: 118,
                '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                '& .MuiInputBase-input': { py: 0.75, fontSize: '0.875rem' },
              }}
            />
            <TextField
              size="small"
              type="time"
              label="To"
              value={endTime}
              onChange={(e) => onEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              sx={{
                width: 118,
                '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                '& .MuiInputBase-input': { py: 0.75, fontSize: '0.875rem' },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * Compact duration / coverage controls for time-off forms.
 */
const TimeOffCoverageFields = ({
  startDate,
  endDate,
  coverage,
  startDayCoverage,
  endDayCoverage,
  startTime,
  endTime,
  endStartTime,
  endEndTime,
  onCoverageChange,
  onStartDayCoverageChange,
  onEndDayCoverageChange,
  onStartTimeChange,
  onEndTimeChange,
  onEndStartTimeChange,
  onEndEndTimeChange,
}) => {
  const singleDay = isSingleDayRange(startDate, endDate);
  const multiDay = startDate && endDate && startDate < endDate;

  if (!startDate || !endDate) {
    return (
      <Typography variant="caption" color="text.secondary">
        Set dates to configure duration.
      </Typography>
    );
  }

  if (singleDay) {
    return (
      <CoverageDayControl
        dayLabel="Duration"
        dateYmd={null}
        value={coverage}
        onChange={onCoverageChange}
        startTime={startTime}
        endTime={endTime}
        onStart={onStartTimeChange}
        onEnd={onEndTimeChange}
      />
    );
  }

  if (multiDay) {
    return (
      <Box>
        <Grid container spacing={1.5} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            <CoverageDayControl
              dayLabel="First"
              dateYmd={startDate}
              value={startDayCoverage}
              onChange={onStartDayCoverageChange}
              startTime={startTime}
              endTime={endTime}
              onStart={onStartTimeChange}
              onEnd={onEndTimeChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CoverageDayControl
              dayLabel="Last"
              dateYmd={endDate}
              value={endDayCoverage}
              onChange={onEndDayCoverageChange}
              startTime={endStartTime}
              endTime={endEndTime}
              onStart={onEndStartTimeChange}
              onEnd={onEndEndTimeChange}
            />
          </Grid>
        </Grid>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1, fontSize: '0.7rem' }}
        >
          Middle days in the range count as full days off.
        </Typography>
      </Box>
    );
  }

  return null;
};

export default TimeOffCoverageFields;
