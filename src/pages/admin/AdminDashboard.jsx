import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
  CardHeader,
  styled,
  LinearProgress,
} from '@mui/material';
import {
  Description,
  Warning,
  Error as ErrorIcon,
  Refresh,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { useGetAnalyticsQuery, useGetHeatMapQuery, useGetLeadFunnelReportQuery, useGetSalesForecastingQuery } from '../../store/api/dashboardApi';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, File, FileText, PersonStandingIcon } from 'lucide-react';

const STATUS_COLORS = {
  paid: '#22c55e',
  unpaid: '#f97316',
  due: '#eab308',
  overdue: '#ef4444',
  draft: '#64748b',
  sent: '#3b82f6',
};

const ProgressBar = styled(LinearProgress)(({ trackcolor, barcolor, height }) => ({
  height: height || 6,           // similar to h-1.5
  borderRadius: 4,
  backgroundColor: trackcolor, // your bg-success-light
  "& .MuiLinearProgress-bar": {
    backgroundColor: barcolor, // your bg-success
    borderRadius: 4,
  },
}));

export const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [filters, setFilters] = useState({
    granularity: 'monthly',
    start_date: format(new Date(new Date().setMonth(new Date().getMonth() - 3)), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'all',
  });

  const [heatmapParams, setHeatmapParams] = useState({
    days: '7',
    sort_by: 'total_value',
    order: 'desc',
    view: 'heatmap',
  });

  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useGetAnalyticsQuery(filters);
  const { data: heatmapData, isLoading: heatmapLoading, refetch: refetchHeatmap } = useGetHeatMapQuery(heatmapParams);

  const { data: salesForecastData, isLoading: forecastLoading } = useGetSalesForecastingQuery(filters);
  const { data: leadFunnelData, isLoading: leadFunnelLoading } = useGetLeadFunnelReportQuery(filters);

  const formatForecastChartData = () => {
    if (!salesForecastData?.forecasts?.monthly?.periods) return [];
    return salesForecastData.forecasts.monthly.periods
      .slice(0, 6)
      .map((period) => ({
        month: format(new Date(period.month), 'MMM yyyy'),
        revenue: period.forecasted_revenue,
        invoices: period.forecasted_invoice_count,
      }));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    refetchAnalytics();
  };

  const formatTrendData = () => {
    if (!analyticsData?.trends) return [];
    return analyticsData.trends.map((trend) => ({
      period: format(new Date(trend.period), 'MMM yyyy'),
      Paid: trend.total_paid,
      Unpaid: trend.total_due,
    }));
  };

  const formatStatusData = () => {
    if (!analyticsData?.status_distribution) return [];
    return Object.entries(analyticsData.status_distribution)
      .filter(([_, value]) => value.count > 0)
      .map(([key, value]) => ({
        name: value.label,
        value: value.count,
        amount: value.total,
        color: STATUS_COLORS[key] || '#64748b',
      }));
  };

  const getLoadLevelColor = (level) => {
    switch (level) {
      case 'none': return '#f1f5f9';
      case 'light': return 'rgba(34, 197, 94, 0.4)';
      case 'moderate': return 'rgba(251, 191, 36, 0.6)';
      case 'heavy': return 'rgba(239, 68, 68, 0.8)';
      default: return '#f1f5f9';
    }
  };

  if (analyticsLoading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invoice analytics and technician workload overview
            </Typography>
          </Box>
        </Box>

        {/* Summary Cards Skeleton - Matching actual design */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="shadow-sm bg-gradient-to-br from-gray-100/60 to-gray-100/10 rounded-lg">
              <Box className="flex items-center justify-between px-4 pt-4">
                <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: 'rgba(0,0,0,0.1)' }} />
                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(0,0,0,0.1)' }} />
              </Box>
              <CardContent>
                <Skeleton variant="text" width="70%" height={36} sx={{ bgcolor: 'rgba(0,0,0,0.1)', mb: 1 }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)', mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.08)', mb: 1 }} />
                <Skeleton variant="text" width="60%" height={14} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
              </CardContent>
            </div>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
          <Card sx={{ boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
              <Skeleton variant="text" width="60%" height={16} sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.08)' }} />
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.08)' }} />
            </CardContent>
          </Card>
          <Card sx={{ boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Skeleton variant="text" width="50%" height={24} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.08)' }} />
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.08)' }} />
            </CardContent>
          </Card>
        </div>

        {/* Lead Funnel Skeleton - Replace Top Customers skeleton */}
          <Card sx={{ mb: 3, boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.08)' }} />
              
              {/* Summary skeleton */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} variant="rectangular" height={70} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.08)' }} />
                ))}
              </Box>
              
              {/* Funnel stages skeleton */}
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.08)' }} />
              ))}
            </CardContent>
          </Card>

          {/* Sales Forecasting Skeleton */}
          <Card sx={{ mb: 3, boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.08)' }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} variant="rectangular" height={70} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.08)' }} />
                ))}
              </Box>
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.08)' }} />
            </CardContent>
          </Card>

          {/* Top Customers Skeleton - now at the end */}
          <Card sx={{ mb: 3, boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.08)' }} />
              <Box sx={{ mt: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <Skeleton variant="text" width="25%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                    <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                    <Skeleton variant="text" width="15%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                    <Skeleton variant="text" width="10%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                    <Skeleton variant="text" width="15%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

        {/* Heatmap Skeleton */}
        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Skeleton variant="text" width="50%" height={24} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.08)' }} />
            <Box sx={{ mt: 3 }}>
              {[1, 2, 3, 4].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Skeleton variant="text" width="20%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                    <Skeleton variant="text" width="15%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <Skeleton 
                        key={j} 
                        variant="rectangular" 
                        width="100%" 
                        height={60} 
                        sx={{ 
                          borderRadius: 1, 
                          bgcolor: 'rgba(0,0,0,0.08)',
                          flex: 1
                        }} 
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header - Compact on mobile */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invoice analytics and technician workload overview
            </Typography>
          </Box>
          <IconButton 
            onClick={() => { 
              refetchAnalytics(); 
              refetchHeatmap(); 
            }} 
            color="primary"
            size={isMobile ? 'small' : 'medium'}
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Filters Section - Responsive */}
        <Card sx={{ mb: 3, boxShadow: 1 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Granularity</InputLabel>
                  <Select
                    value={filters.granularity}
                    label="Granularity"
                    onChange={(e) => handleFilterChange('granularity', e.target.value)}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={new Date(filters.start_date)}
                  onChange={(date) =>
                    date && handleFilterChange('start_date', format(date, 'yyyy-MM-dd'))
                  }
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={new Date(filters.end_date)}
                  onChange={(date) =>
                    date && handleFilterChange('end_date', format(date, 'yyyy-MM-dd'))
                  }
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="void">Void</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={handleApplyFilters}
                  size={isMobile ? 'small' : 'medium'}
                  fullWidth={isMobile}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Cards - Responsive Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 mb-4">
          <div className="shadow-sm bg-gradient-to-br from-stone-200/60 to-from-stone-200/10 rounded-lg">
            <Box className="flex items-center justify-between px-4 pt-4">
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Total Invoices
              </Typography>
              <div className="h-8 w-8 rounded-full bg-stone-400/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </Box>
            <CardContent >
              <div className="text-3xl font-bold">{analyticsData?.summary.total_invoices || 0}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analyticsData?.paid_unpaid_overview.paid.count || 0} paid • {analyticsData?.paid_unpaid_overview.unpaid.count || 0} unpaid
              </p>
            </CardContent>
          </div>

          <div className="shadow-sm bg-gradient-to-br from-green-100/60 to-green-100/10 rounded-lg">
            <Box className="flex flex-row items-center justify-between px-4 pt-4">
              <Typography variant="body2" color="text.secondary" fontWeight="500">Paid / Collected</Typography>
              <div className="h-8 w-8 rounded-full bg-green-400/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </Box>
            <CardContent >
              <div className="text-3xl font-bold">{analyticsData?.paid_unpaid_overview.paid.count || 0}</div>
              <p className="text-sm font-medium text-success mt-0.5">
                {formatCurrency(analyticsData?.paid_unpaid_overview.paid.total || 0)}
              </p>
              <div className="mt-2">
                <Box mt={2}>
                  <ProgressBar 
                    variant="determinate" 
                    value={(analyticsData.summary.total_paid / analyticsData.summary.total_amount * 100) || 0} 
                    trackcolor="#E3F9E5"   // light
                    barcolor="#16A34A"
                  />
                </Box>
              </div>
              <p className="text-xs text-muted-foreground">
                {((analyticsData.summary.total_paid / analyticsData.summary.total_amount * 100) || 0).toFixed(1)}% collected
              </p>
            </CardContent>
          </div>

          <div className="shadow-sm bg-gradient-to-br from-orange-100/60 to-orange-100/10 rounded-lg">
            <Box className="flex flex-row items-center justify-between px-4 pt-4">
              <Typography variant="body2" color="text.secondary" fontWeight="500">Outstanding / Unpaid</Typography>
              <div className="h-8 w-8 rounded-full bg-orange-300/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
            </Box>
            <CardContent >
              <div className="text-3xl font-bold">{analyticsData?.paid_unpaid_overview.unpaid.count || 0}</div>
              <p className="text-sm font-medium text-orange-400 mt-0.5">
                {formatCurrency(analyticsData?.paid_unpaid_overview.unpaid.total || 0)}
              </p>
              <div className="mt-2">
                <Box mt={2}>
                  <ProgressBar 
                    variant="determinate" 
                    value={(analyticsData.paid_unpaid_overview.unpaid.total / analyticsData.summary.total_amount * 100) || 0} 
                    trackcolor="#fffaf0"   // light
                    barcolor="#fb923c"
                  />
                </Box>
              </div>
              <p className="text-xs text-muted-foreground">
                {((analyticsData.paid_unpaid_overview.unpaid.total / analyticsData.summary.total_amount * 100) || 0).toFixed(1)}% pending
              </p>
            </CardContent>
          </div>

          <div className="shadow-sm bg-gradient-to-br from-yellow-100/60 to-yellow-100/10 rounded-lg">
            <Box className="flex flex-row items-center justify-between px-4 pt-4">
              <Typography variant="body2" color="text.secondary" fontWeight="500">Due</Typography>
              <div className="h-8 w-8 rounded-full bg-yellow-300/20 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
              </div>
            </Box>
            <CardContent >
              <div className="text-3xl font-bold">{analyticsData?.status_distribution.due?.count || 0}</div>
              <p className="text-sm font-medium text-yellow-400 mt-0.5">
                {formatCurrency(analyticsData?.status_distribution.due?.total || 0)}
              </p>
              <div className="mt-2">
                <Box mt={2}>
                  <ProgressBar 
                    variant="determinate" 
                    value={(analyticsData.status_distribution.due?.total / analyticsData.summary.total_amount * 100) || 0} 
                    trackcolor="#fef9c3"   // light
                    barcolor="#facc15"
                  />
                </Box>
              </div>
              <p className="text-xs text-muted-foreground">
                {((analyticsData.status_distribution.due?.total / analyticsData.summary.total_amount * 100) || 0).toFixed(1)}% of total amount
              </p>
            </CardContent>
          </div>

          <div className="shadow-sm bg-gradient-to-br from-red-100/60 to-red-100/10 rounded-lg">
            <Box className="flex flex-row items-center justify-between px-4 pt-4">
              <Typography variant="body2" color="text.secondary" fontWeight="500">Overdue</Typography>
              <div className="h-8 w-8 rounded-full bg-red-300/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </Box>
            <CardContent >
              <div className="text-3xl font-bold">{analyticsData?.summary.overdue_count || 0}</div>
              <p className="text-sm font-medium text-red-400 mt-0.5">
                {formatCurrency(analyticsData?.summary.overdue_total || 0)}
              </p>
              <div className="mt-2">
                <Box mt={2}>
                  <ProgressBar 
                    variant="determinate" 
                    value={(analyticsData.summary.overdue_total / analyticsData.summary.total_amount * 100) || 0} 
                    trackcolor="#fee2e2"   // light
                    barcolor="#f87171"
                  />
                </Box>
              </div>
              <p className="text-xs text-muted-foreground">
                {((analyticsData.summary.overdue_total / analyticsData.summary.total_amount * 100) || 0).toFixed(1)}% of total amount
              </p>
            </CardContent>
          </div>

          <div className="shadow-sm bg-gradient-to-br from-blue-100/60 to-blue-100/10 rounded-lg">
            <Box className="flex flex-row items-center justify-between px-4 pt-4">
              <Typography variant="body2" color="text.secondary" fontWeight="500">Draft</Typography>
              <div className="h-8 w-8 rounded-full bg-blue-300/20 flex items-center justify-center">
                <File className="h-4 w-4 text-blue-400" />
              </div>
            </Box>
            <CardContent >
              <div className="text-3xl font-bold">{analyticsData?.status_distribution.draft?.count || 0}</div>
              <p className="text-sm font-medium text-blue-400 mt-0.5">
                {formatCurrency(analyticsData?.status_distribution.draft?.total || 0)}
              </p>
              <div className="mt-2">
                <Box mt={2}>
                  <ProgressBar 
                    variant="determinate" 
                    value={(analyticsData?.status_distribution.draft?.total / analyticsData.summary.total_amount * 100) || 0} 
                    trackcolor="#dbeafe"   // light
                    barcolor="#60a5fa"
                  />
                </Box>
              </div>
              <p className="text-xs text-muted-foreground">
                {((analyticsData.status_distribution.draft?.total / analyticsData.summary.total_amount * 100) || 0).toFixed(1)}% of total amount
              </p>
            </CardContent>
          </div>
        </div>

        {/* Charts Section - Responsive */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
          <Card sx={{ boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Revenue Trends
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Paid vs Outstanding over time
              </Typography>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart data={formatTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Bar dataKey="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Unpaid" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card sx={{ boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Invoice Status Distribution
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Breakdown by status
              </Typography>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <PieChart>
                  <Pie
                    data={formatStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => isMobile ? '' : `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={isMobile ? 70 : 90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      value,
                      `${props.payload.name} (${formatCurrency(props.payload.amount)})`,
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                    iconSize={isMobile ? 8 : 14}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Lead Funnel Report - Replace Top Customers position */}
          <Card sx={{ mb: 3, boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Lead Funnel Report
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                Pipeline overview for the last 7 days
              </Typography>

              {leadFunnelLoading ? (
                <Box sx={{ mt: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                      <Skeleton variant="text" width="30%" height={20} />
                      <Skeleton variant="text" width="20%" height={20} />
                      <Skeleton variant="text" width="25%" height={20} />
                    </Box>
                  ))}
                </Box>
              ) : leadFunnelData ? (
                <>
                  {/* Summary Metrics */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    mb: 3,
                    p: 2,
                    bgcolor: '#f9fafb',
                    borderRadius: 2
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Pipeline Value
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="primary.main">
                        {formatCurrency(leadFunnelData.summary_metrics.pipeline_value)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total Items
                      </Typography>
                      <Typography variant="h6" fontWeight="600">
                        {leadFunnelData.summary_metrics.total_pipeline_items}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Acceptance Rate
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="success.main">
                        {leadFunnelData.summary_metrics.acceptance_rate_percent.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Closed Revenue
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="success.main">
                        {formatCurrency(leadFunnelData.summary_metrics.total_revenue_closed_jobs)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Funnel Stages */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* New Leads */}
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main'
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'blue.50',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <PersonStandingIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {leadFunnelData.lead_funnel.new_leads.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              New opportunities
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={leadFunnelData.lead_funnel.new_leads.count} 
                          color="primary" 
                          sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                        />
                      </Box>
                    </Box>

                    {/* Open Estimates */}
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'warning.main'
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'orange.50',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Description sx={{ color: 'warning.main', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {leadFunnelData.lead_funnel.open_estimates.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pending decision
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip 
                            label={leadFunnelData.lead_funnel.open_estimates.count} 
                            color="warning" 
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5 }}
                          />
                          <Typography variant="caption" color="warning.main" fontWeight="600" display="block">
                            {formatCurrency(leadFunnelData.lead_funnel.open_estimates.total_value)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Accepted Estimates */}
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'success.main'
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'success.lighter',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {leadFunnelData.lead_funnel.accepted_estimates.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ready to schedule
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip 
                            label={leadFunnelData.lead_funnel.accepted_estimates.count} 
                            color="success" 
                            sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5 }}
                          />
                          <Typography variant="caption" color="success.main" fontWeight="600" display="block">
                            {formatCurrency(leadFunnelData.lead_funnel.accepted_estimates.total_value)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Scheduled Jobs */}
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'info.main'
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'info.lighter',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Clock sx={{ color: 'info.main', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {leadFunnelData.lead_funnel.scheduled_jobs.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              In progress
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip 
                            label={leadFunnelData.lead_funnel.scheduled_jobs.count} 
                            color="info" 
                            sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5 }}
                          />
                          <Typography variant="caption" color="info.main" fontWeight="600" display="block">
                            {formatCurrency(leadFunnelData.lead_funnel.scheduled_jobs.total_value)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Closed Jobs */}
                    <Box sx={{ 
                      p: 2, 
                      border: '2px solid', 
                      borderColor: 'success.main',
                      borderRadius: 2,
                      bgcolor: 'success.lighter',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="600" color="success.dark">
                              {leadFunnelData.lead_funnel.closed_jobs.label}
                            </Typography>
                            <Typography variant="caption" color="success.dark">
                              Revenue generated
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip 
                            label={leadFunnelData.lead_funnel.closed_jobs.count} 
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.875rem', 
                              mb: 0.5,
                              bgcolor: 'success.main',
                              color: 'white'
                            }}
                          />
                          <Typography variant="body2" color="success.dark" fontWeight="700" display="block">
                            {formatCurrency(leadFunnelData.lead_funnel.closed_jobs.total_value)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <Alert severity="info">No lead funnel data available</Alert>
              )}
            </CardContent>
          </Card>

          {/* Sales Forecasting */}
          <Card sx={{ mb: 3, boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Sales Forecasting
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                Revenue predictions for the next 6 months
              </Typography>

              {forecastLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : salesForecastData ? (
                <>
                  {/* Forecast Summary Cards */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                    gap: 2,
                    mb: 3
                  }}>
                    <Paper sx={{ p: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Next 8 Weeks
                      </Typography>
                      <Typography variant="h6" fontWeight="700" color="primary.main">
                        {formatCurrency(salesForecastData.forecasts.weekly.total_forecasted_revenue_8_weeks)}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Next 12 Months
                      </Typography>
                      <Typography variant="h6" fontWeight="700" color="success.main">
                        {formatCurrency(salesForecastData.forecasts.monthly.total_forecasted_revenue_12_months)}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Next 4 Quarters
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ color: '#d97706' }}>
                        {formatCurrency(salesForecastData.forecasts.quarterly.total_forecasted_revenue_4_quarters)}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: '#fce7f3', border: '1px solid #fbcfe8' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Historical Revenue
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ color: '#db2777' }}>
                        {formatCurrency(salesForecastData.historical_period.total_revenue)}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Forecast Chart */}
                  <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                    <BarChart data={formatForecastChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 30}
                      />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(Number(value)) : value,
                          name === 'revenue' ? 'Forecasted Revenue' : 'Invoice Count'
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Forecasted Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Based on {salesForecastData.historical_period.total_invoices} historical invoices from{' '}
                    {format(new Date(salesForecastData.historical_period.start_date), 'MMM dd, yyyy')} to{' '}
                    {format(new Date(salesForecastData.historical_period.end_date), 'MMM dd, yyyy')}
                  </Typography>
                </>
              ) : (
                <Alert severity="info">No forecasting data available</Alert>
              )}
            </CardContent>
          </Card>

        {/* Technician Workload Heatmap - Responsive */}
        {heatmapData && (
          <Card sx={{ boxShadow: 1 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Sales Activities by Representative (Next 7 Days)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Daily job distribution and sales by technician
                </Typography>
              </Box>

              {/* Legend - Responsive */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f9fafb' }}>
                <Typography variant="caption" fontWeight="600" textAlign="center" display="block" gutterBottom>
                  Job Load Intensity
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: { xs: 1.5, sm: 3 }, 
                  flexWrap: 'wrap' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: { xs: 16, sm: 20 }, height: { xs: 16, sm: 20 }, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>No jobs</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: { xs: 16, sm: 20 }, height: { xs: 16, sm: 20 }, bgcolor: 'rgba(34, 197, 94, 0.4)', border: '1px solid #e2e8f0', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Light (1-2)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: { xs: 16, sm: 20 }, height: { xs: 16, sm: 20 }, bgcolor: 'rgba(251, 191, 36, 0.6)', border: '1px solid #e2e8f0', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Moderate (3-4)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: { xs: 16, sm: 20 }, height: { xs: 16, sm: 20 }, bgcolor: 'rgba(239, 68, 68, 0.8)', border: '1px solid #e2e8f0', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Heavy (5+)</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Heatmap Grid - Responsive */}
              <Box sx={{ overflowX: 'auto' }}>
                {heatmapLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : heatmapData?.technicians?.length > 0 ? (
                  <Box sx={{ minWidth: { xs: 400, sm: 500, md: 600 } }}>
                    {heatmapData.technicians.map((tech) => (
                      <Box key={tech.technician_id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
                          <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {tech.technician_name}
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight="700" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {formatCurrency(tech.total_value)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {tech.days.map((day, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                flex: 1,
                                minWidth: { xs: 45, sm: 55 },
                                height: { xs: 50, sm: 60 },
                                bgcolor: getLoadLevelColor(day.load_level),
                                border: '1px solid #e2e8f0',
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: 1,
                                },
                              }}
                              title={`${day.label}: ${day.job_count} jobs, ${formatCurrency(day.total_value)}`}
                            >
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 8, sm: 9 } }}>
                                {day.label.split(' ')[1]}
                              </Typography>
                              {day.job_count > 0 && (
                                <>
                                  <Typography variant="body2" fontWeight="700" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    {day.job_count}
                                  </Typography>
                                  <Typography variant="caption" color="success.main" fontWeight="700" sx={{ fontSize: { xs: 8, sm: 9 } }}>
                                    ${day.total_value.toFixed(0)}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    No scheduled jobs found for the next 7 days
                  </Alert>
                )}
              </Box>

              {heatmapData?.summary && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Total: {heatmapData.summary.total_jobs} jobs worth {formatCurrency(heatmapData.summary.total_value)}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Card sx={{ mt: 3, boxShadow: 1 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Top Customers
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Highest revenue generating customers
            </Typography>
            <TableContainer>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Email</TableCell>}
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Invoiced</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Count</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Paid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData?.top_customers?.slice(0, 5).map((customer, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {isMobile ? customer.contact_name.split(' ')[0] : customer.contact_name}
                      </TableCell>
                      {!isMobile && (
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                          {customer.contact_email}
                        </TableCell>
                      )}
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {isMobile ? `$${(customer.total_invoiced / 1000).toFixed(1)}k` : formatCurrency(customer.total_invoiced)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={customer.invoices_count} 
                          size="small"
                          sx={{ 
                            height: isMobile ? 20 : 24,
                            fontSize: isMobile ? '0.65rem' : '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {isMobile ? `$${(customer.total_paid / 1000).toFixed(1)}k` : formatCurrency(customer.total_paid)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
          
      </Box>
    </LocalizationProvider>
  );
};

export default AdminDashboard;