"use client"

import { useState } from "react"
import moment from "moment-timezone"
import { useUpdateJobMutation } from "../../../store/api/jobsApi"
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Alert,
  Stack,
} from "@mui/material"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  EventNote as EventIcon,
  AccessTime as TimeIcon,
  RotateRight as RecurringIcon,
} from "@mui/icons-material"
import DeleteJobDialog from "./DeleteJobDialog" // Import DeleteJobDialog component

export function JobCard({ job, onUpdate, onEdit, onDelete, users = [], accountTimezone = "America/Chicago" }) {
  const [updating, setUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateJob] = useUpdateJobMutation()

  const getStatusColor = (status) => {
    const colors = {
      pending: "#fbbf24",
      confirmed: "#06b6d4",
      on_the_way: "#f97316",
      in_progress: "#3b82f6",
      completed: "#10b981",
      cancelled: "#ef4444",
      service_due: "#a855f7",
    }
    return colors[status] || "#6b7280"
  }

  const getPriorityColor = (priority) => {
    // Handle both string and numeric priority values
    const priorityStr = String(priority).toLowerCase()
    if (priorityStr === "high" || priority >= 3) return "error"
    if (priorityStr === "medium" || priority === 2) return "warning"
    return "success"
  }

  const getPriorityLabel = (priority) => {
    // Handle both string and numeric priority values
    const priorityStr = String(priority).toLowerCase()
    if (priorityStr === "high" || priority >= 3) return "High"
    if (priorityStr === "medium" || priority === 2) return "Medium"
    return "Low"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled"
    // Parse as UTC and format in UTC to show time directly from API without conversion
    const m = moment.utc(dateString);
    return m.format("MM/DD/YYYY h:mm A");
  }

  const formatPrice = (price) => {
    if (!price) return null
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const updateJobStatus = async (newStatus) => {
    if (!job) return
    
    // Get job ID - support both job_id and id fields
    const jobId = job.job_id || job.id
    if (!jobId) {
      console.error("Job ID not found")
      return
    }
    
    setUpdating(true)
    try {
      const result = await updateJob({
        id: jobId,
        status: newStatus,
      }).unwrap()
      
      // Call onUpdate callback if provided to update parent component state
      if (onUpdate) {
        onUpdate(result)
      }
    } catch (error) {
      console.error("Failed to update job status:", error)
      // Optionally show error message to user
    } finally {
      setUpdating(false)
    }
  }

 const assignedUserNames =
  job.assignments
    .map((assignment) => {
      // Look up the user from the users array
      if (assignment.user && users.length > 0) {
        const user = users.find((u) => u.id === assignment.user);
        if (user) {
          // Use first_name + last_name if available, otherwise fall back to email
          if (user.first_name || user.last_name) {
            return `${user.first_name || ""} ${user.last_name || ""}`.trim();
          } else if (user.email) {
            return user.email;
          }
        }
      }
      // Fall back to assignment user_email or user ID if nothing else is available
      return assignment.user_email || assignment.user || "";
    })
    .filter((name) => name) // Remove empty strings
    .join(", ") || "";

  const quotedByUser = users.find((u) => u.id === job.quoted_by)?.name || job.quoted_by

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <CardHeader
        sx={{minHeight: 10}}
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" component="span">
                {job.title}
              </Typography>
              {job.is_recurring && <Chip icon={<RecurringIcon />} label="Recurring" size="small" variant="outlined" />}
            </Box>
          }
          subheader={job.description}
          action={
            <Box>
              <IconButton size="small" onClick={() => onEdit(job)} title="Edit job">
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setDeleteDialogOpen(true)} title="Delete job">
                <DeleteIcon />
              </IconButton>
            </Box>
          }
        />

        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            justifyContent: 'space-between',
          }}
        >

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={job.status.replace(/_/g, " ")}
              sx={{
                bgcolor: getStatusColor(job.status),
                color: "white",
                textTransform: "capitalize",
                fontSize: "0.8rem",
              }}
            />
            <Chip
              label={`${getPriorityLabel(job.priority)} Priority`}
              color={getPriorityColor(job.priority)}
              sx={{ fontSize: "0.8rem" }}
            />
            <Chip label={job.job_type} variant="outlined" sx={{ fontSize: "0.8rem" }}/>
            {job.first_time && <Chip label="First Time" color="info" sx={{ fontSize: "0.8rem" }}/>}
          </Box>

          {/* Job Details */}
          <Stack spacing={1.5} direction="column" justifyContent="flex-start">
            {job.customer_name && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">{job.customer_name}</Typography>
              </Box>
            )}

            {job.customer_address && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography
                  variant="body2"
                  sx={{
                    cursor: "pointer",
                    color: "primary.main",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.customer_address)}`,
                      "_blank",
                    )
                  }
                >
                  {job.customer_address}
                </Typography>
              </Box>
            )}

            {job.customer_phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography
                  variant="body2"
                  component="a"
                  href={`tel:${job.customer_phone}`}
                  sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {job.customer_phone}
                </Typography>
              </Box>
            )}

            {job.customer_email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography
                  variant="body2"
                  component="a"
                  href={`mailto:${job.customer_email}`}
                  sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {job.customer_email}
                </Typography>
              </Box>
            )}

            {quotedByUser && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Quoted by:</strong> {quotedByUser}
                </Typography>
              </Box>
            )}

            {assignedUserNames && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Assigned:</strong> {assignedUserNames}
                </Typography>
              </Box>
            )}

            {job.total_price && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MoneyIcon fontSize="small" color="action" />
                <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
                  {formatPrice(job.total_price)}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatDate(job.scheduled_at)}</Typography>
            </Box>

            {job.duration_hours && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2">{job.duration_hours} hours</Typography>
              </Box>
            )}
          </Stack>

          <Box sx={{gap: 2, display: 'flex', flexDirection: 'column' }}>
            {job.notes && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Notes:</strong> {job.notes}
              </Alert>
            )}

            <Select
              value={job.status}
              onValueChange={updateJobStatus}
              disabled={updating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="service_due">Service Due</SelectItem>
                <SelectItem value="on_the_way">On The Way</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </Box>
        </CardContent>
      </Card>

      {deleteDialogOpen && (
        <DeleteJobDialog
          job={job}
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDelete={(jobToDelete, option) => {
            onDelete(jobToDelete, option)
            setDeleteDialogOpen(false)
          }}
        />
      )}
    </>
  )
}
