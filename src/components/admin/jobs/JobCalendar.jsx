"use client"

import { useState, useMemo } from "react"
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Paper,
  Grid,
} from "@mui/material"
import { jobGrandTotalAmount } from "../../../utils/jobPricing"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  EventNote as EventIcon,
  AccessTime as TimeIcon,
  RotateRight as RecurringIcon,
} from "@mui/icons-material"

export function JobCalendar({ jobs = [], statusFilter = "all", assigneeFilter = "all", users = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)) // November 2025
  const [selectedJob, setSelectedJob] = useState(null)
  const [viewMode, setViewMode] = useState("month")

  // Filter jobs based on filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false
      if (assigneeFilter !== "all" && !job.assigned_users?.includes(assigneeFilter)) return false
      return true
    })
  }, [jobs, statusFilter, assigneeFilter])

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped = {}
    filteredJobs.forEach((job) => {
      if (job.scheduled_date) {
        const date = new Date(job.scheduled_date)
        const dateKey = date.toISOString().split("T")[0]
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(job)
      }
    })
    return grouped
  }, [filteredJobs])

  // Get calendar days for current month
  const getDaysInMonth = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }

    return days
  }

  const days = getDaysInMonth()
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })

  const getStatusColor = (status) => {
    const colors = {
      pending: "#fbbf24",
      confirmed: "#06b6d4",
      on_the_way: "#f97316",
      in_progress: "#3b82f6",
      onhold: "#8b5cf6",
      completed: "#10b981",
      cancelled: "#ef4444",
      service_due: "#a855f7",
    }
    return colors[status] || "#6b7280"
  }

  const formatPrice = (price) => {
    if (!price) return null
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled"
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const JobDetailModal = () => (
    <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} maxWidth="sm" fullWidth>
      <DialogTitle>{selectedJob?.title}</DialogTitle>
      <DialogContent>
        {selectedJob && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={selectedJob.status.replace(/_/g, " ")}
                sx={{
                  bgcolor: getStatusColor(selectedJob.status),
                  color: "white",
                  textTransform: "capitalize",
                }}
                size="small"
              />
              <Chip label={selectedJob.job_type} variant="outlined" size="small" />
              {selectedJob.first_time && <Chip label="First Time" color="info" size="small" />}
              {selectedJob.is_recurring && (
                <Chip icon={<RecurringIcon />} label="Recurring" size="small" variant="outlined" />
              )}
            </Box>

            {selectedJob.customer_name && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">{selectedJob.customer_name}</Typography>
              </Box>
            )}

            {selectedJob.customer_address && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2">{selectedJob.customer_address}</Typography>
              </Box>
            )}

            {selectedJob.customer_phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography
                  variant="body2"
                  component="a"
                  href={`tel:${selectedJob.customer_phone}`}
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  {selectedJob.customer_phone}
                </Typography>
              </Box>
            )}

            {selectedJob.customer_email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography
                  variant="body2"
                  component="a"
                  href={`mailto:${selectedJob.customer_email}`}
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  {selectedJob.customer_email}
                </Typography>
              </Box>
            )}

            {(() => {
              const hasApiTotals =
                selectedJob.total_price != null || selectedJob.total_surcharge != null
              const displayAmount = hasApiTotals
                ? jobGrandTotalAmount(selectedJob)
                : parseFloat(selectedJob.price) || 0
              if (!displayAmount) return null
              return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MoneyIcon fontSize="small" color="action" />
                <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
                  {formatPrice(displayAmount)}
                </Typography>
              </Box>
              )
            })()}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatDate(selectedJob.scheduled_date)}</Typography>
            </Box>

            {selectedJob.estimated_duration && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2">{selectedJob.estimated_duration} hours</Typography>
              </Box>
            )}

            {selectedJob.notes && (
              <Box sx={{ bgcolor: "info.light", p: 1, borderRadius: 1 }}>
                <Typography variant="caption">
                  <strong>Notes:</strong> {selectedJob.notes}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelectedJob(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  )

  const CalendarDay = ({ day }) => {
    if (!day) {
      return <Box sx={{ aspectRatio: "1", bgcolor: "#f5f5f5" }} />
    }

    const dateKey = day.toISOString().split("T")[0]
    const dayJobs = jobsByDate[dateKey] || []
    const isToday = new Date().toDateString() === day.toDateString()

    return (
      <Paper
        sx={{
          aspectRatio: "1",
          p: 1,
          display: "flex",
          flexDirection: "column",
          border: isToday ? "2px solid" : "1px solid",
          borderColor: isToday ? "primary.main" : "divider",
          bgcolor: isToday ? "primary.light" : "background.paper",
          cursor: "pointer",
          overflow: "hidden",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Typography variant="caption" fontWeight="bold">
          {day.getDate()}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            flex: 1,
            overflow: "auto",
            fontSize: "0.7rem",
          }}
        >
          {dayJobs.slice(0, 3).map((job, idx) => (
            <Box
              key={idx}
              onClick={() => setSelectedJob(job)}
              sx={{
                bgcolor: getStatusColor(job.status),
                color: "white",
                p: 0.5,
                borderRadius: 0.5,
                fontSize: "0.65rem",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
              title={job.title}
            >
              {job.title}
            </Box>
          ))}
          {dayJobs.length > 3 && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem" }}>
              +{dayJobs.length - 3} more
            </Typography>
          )}
        </Box>
      </Paper>
    )
  }

  return (
    <Box>
      {/* Calendar Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={monthName}
          action={
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                size="small"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                startIcon={<ChevronLeftIcon />}
              >
                Prev
              </Button>
              <Button size="small" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button
                size="small"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                endIcon={<ChevronRightIcon />}
              >
                Next
              </Button>
            </Box>
          }
        />
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent>
          {/* Weekday Headers */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Grid item xs={12 / 7} key={day}>
                <Typography variant="subtitle2" align="center" fontWeight="bold">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Weeks */}
          {weeks.map((week, weekIdx) => (
            <Grid container spacing={1} key={weekIdx} sx={{ mb: 1 }}>
              {week.map((day, dayIdx) => (
                <Grid item xs={12 / 7} key={dayIdx}>
                  <CalendarDay day={day} />
                </Grid>
              ))}
            </Grid>
          ))}

          {/* Jobs Count */}
          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Job Detail Modal */}
      <JobDetailModal />
    </Box>
  )
}
