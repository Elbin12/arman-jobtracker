"use client"

import { useState, useEffect } from "react"
import moment from "moment-timezone"
import { useUpdateJobMutation } from "../../../store/api/jobsApi"
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Divider,
} from "@mui/material"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  RotateCw,
  FileText,
  ExternalLink,
} from "lucide-react"
import DeleteJobDialog from "./DeleteJobDialog"
import StatusChangeConfirmationDialog from "./StatusChangeConfirmationDialog"

export function JobCard({ job, onUpdate, onEdit, onDelete, users = [], accountTimezone = "America/Chicago" }) {
  const [updating, setUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [displayStatus, setDisplayStatus] = useState(job?.status)
  const [updateJob] = useUpdateJobMutation()

  // Update displayStatus when job status changes externally
  useEffect(() => {
    if (job?.status) {
      setDisplayStatus(job.status)
    }
  }, [job?.status])

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
    const priorityStr = String(priority).toLowerCase()
    if (priorityStr === "high" || priority >= 3) return "error"
    if (priorityStr === "medium" || priority === 2) return "warning"
    return "success"
  }

  const getPriorityLabel = (priority) => {
    const priorityStr = String(priority).toLowerCase()
    if (priorityStr === "high" || priority >= 3) return "High"
    if (priorityStr === "medium" || priority === 2) return "Medium"
    return "Low"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled"
    const m = moment.utc(dateString)
    return m.format("MMM D, YYYY · h:mm A")
  }

  const formatPrice = (price) => {
    if (!price) return "$0.00"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  // Normalize name to Title Case
  const toTitleCase = (str) => {
    if (!str) return ""
    return str.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleStatusChange = (newStatus) => {
    // Don't proceed if status hasn't actually changed
    if (newStatus === job?.status) {
      return
    }

    // Check if status change requires confirmation
    if (newStatus === "completed" || newStatus === "cancelled") {
      setPendingStatus(newStatus)
      setStatusChangeDialogOpen(true)
      // Keep the current display status until confirmed
    } else {
      // For other statuses, update directly
      setDisplayStatus(newStatus)
      updateJobStatus(newStatus)
    }
  }

  const updateJobStatus = async (newStatus) => {
    if (!job) return
    
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
      
      if (onUpdate) {
        onUpdate(result)
      }
      
      // Update display status and close dialog after successful update
      setDisplayStatus(newStatus)
      setStatusChangeDialogOpen(false)
      setPendingStatus(null)
    } catch (error) {
      console.error("Failed to update job status:", error)
      // Keep dialog open on error so user can retry
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirmStatusChange = () => {
    if (pendingStatus) {
      updateJobStatus(pendingStatus)
    }
  }

  const handleCancelStatusChange = () => {
    setStatusChangeDialogOpen(false)
    setPendingStatus(null)
    // Reset display status to current job status
    setDisplayStatus(job?.status)
  }

  const assignedUserNames = job.assignments
    ?.map((assignment) => {
      if (assignment.user && users.length > 0) {
        const user = users.find((u) => u.id === assignment.user)
        if (user) {
          if (user.first_name || user.last_name) {
            const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim()
            return toTitleCase(fullName)
          } else if (user.email) {
            return user.email
          }
        }
      }
      const email = assignment.user_email || assignment.user || ""
      return email.includes("@") ? email : toTitleCase(email)
    })
    .filter((name) => name)
    .join(", ") || "Unassigned"

  // Calculate total from items if available
  const servicesTotal = job.items?.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) || job.total_price || 0

  // Check if job is recurring based on job_type
  const isRecurring = job.job_type === "recurring" || job.is_recurring

  // Build status badges (max 3)
  // Priority order: Status, Recurring (if applicable), Priority
  const statusBadges = []
  if (job.status) {
    statusBadges.push({
      label: job.status.replace(/_/g, " "),
      color: getStatusColor(job.status),
      key: "status"
    })
  }
  // Always show recurring if it's a recurring job (business-critical)
  if (isRecurring && statusBadges.length < 3) {
    statusBadges.push({
      label: "Recurring",
      color: "#6366f1", // Indigo color for better visibility
      key: "recurring"
    })
  }
  if (job.priority && statusBadges.length < 3) {
    statusBadges.push({
      label: `${getPriorityLabel(job.priority)} Priority`,
      color: getPriorityColor(job.priority),
      key: "priority"
    })
  }

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header - Fixed height to ensure consistency */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            mb: 2,
            minHeight: '64px', // Fixed minimum height for header
          }}>
            <Box sx={{ flex: 1, pr: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '32px', // Reserve space for title
                }}
              >
                {job.title || "Untitled Job"}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 500,
                  lineHeight: 1.3,
                  minHeight: '24px', // Reserve space for customer name
                }}
              >
                {job.customer_name ? toTitleCase(job.customer_name) : '\u00A0'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <IconButton 
                size="small" 
                onClick={() => onEdit(job)} 
                title="Edit job"
                sx={{ color: 'text.secondary' }}
              >
                <Edit size={18} />
              </IconButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton 
                    size="small" 
                    title="More options"
                    sx={{ color: 'text.secondary' }}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                  {/* Add Duplicate and Archive options here if needed */}
                </DropdownMenuContent>
              </DropdownMenu>
            </Box>
          </Box>

          {/* Status Badges - Fixed height to ensure consistency */}
          <Box sx={{ 
            display: "flex", 
            gap: 1, 
            mb: 3, 
            flexWrap: "wrap",
            minHeight: '32px', // Fixed height for status badges section
            alignItems: 'flex-start',
          }}>
            {statusBadges.length > 0 ? (
              statusBadges.map((badge) => (
                <Chip
                  key={badge.key}
                  label={badge.label}
                  size="small"
                  sx={{
                    bgcolor: badge.color === "error" || badge.color === "warning" || badge.color === "success" 
                      ? undefined 
                      : badge.color,
                    color: badge.color === "error" || badge.color === "warning" || badge.color === "success"
                      ? undefined
                      : "white",
                    textTransform: "capitalize",
                    fontSize: "0.75rem",
                    height: "24px",
                    fontWeight: 500,
                  }}
                  color={badge.color === "error" || badge.color === "warning" || badge.color === "success" 
                    ? badge.color 
                    : undefined}
                />
              ))
            ) : (
              <Box sx={{ height: '24px' }} /> // Placeholder to maintain height
            )}
          </Box>

          {/* 2-Column Layout */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            {/* Left Column - Contact Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5, fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Contact
              </Typography>
              
              {job.customer_name && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <User size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {toTitleCase(job.customer_name)}
                  </Typography>
                </Box>
              )}

              {job.customer_address && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <MapPin size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0, marginTop: '2px' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      cursor: "pointer",
                      color: "primary.main",
                      maxWidth: '200px',
                      lineHeight: 1.4,
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
                  <Phone size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    component="a"
                    href={`tel:${job.customer_phone}`}
                    sx={{ 
                      fontSize: '0.875rem',
                      color: "primary.main", 
                      textDecoration: "none", 
                      "&:hover": { textDecoration: "underline" } 
                    }}
                  >
                    {job.customer_phone}
                  </Typography>
                </Box>
              )}

              {job.customer_email && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Mail size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    component="a"
                    href={`mailto:${job.customer_email}`}
                    sx={{ 
                      fontSize: '0.875rem',
                      color: "primary.main", 
                      textDecoration: "none", 
                      "&:hover": { textDecoration: "underline" } 
                    }}
                  >
                    {job.customer_email}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Right Column - Schedule & Assignment */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5, fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Schedule
              </Typography>

              {job.scheduled_at && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Calendar size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {formatDate(job.scheduled_at)}
                  </Typography>
                </Box>
              )}

              {job.duration_hours && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Clock size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {job.duration_hours} hrs
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <User size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0, marginTop: '2px' }} />
                <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {assignedUserNames}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Services & Pricing - Consistent structure */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 1.5, display: 'block', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
              Services
            </Typography>
            {job.items && job.items.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: '60px' }}>
                  {job.items.map((item, index) => {
                    const serviceName = item.service_name || item.custom_name || "Unknown Service"
                    const itemPrice = parseFloat(item.price) || 0
                    return (
                      <Box key={item.id || index} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', flex: 1, fontWeight: 500, color: 'text.primary' }}>
                          {serviceName}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: "text.secondary", ml: 2, fontWeight: 500 }}>
                          {formatPrice(itemPrice)}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Total
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 700, color: "success.main" }}>
                    {formatPrice(servicesTotal)}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box sx={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic' }}>
                  No services
                </Typography>
              </Box>
            )}
          </Box>

          {/* Invoice URL - Only show for completed jobs - Fixed height */}
          <Box sx={{ mb: 3, minHeight: job.status === "completed" && job.invoice_url ? '100px' : '0px' }}>
            {job.status === "completed" && job.invoice_url && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Box
                  component="a"
                  href={job.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "primary.50",
                    border: "1px solid",
                    borderColor: "primary.200",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "primary.100",
                      borderColor: "primary.300",
                      transform: "translateY(-1px)",
                      boxShadow: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={18} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main", mb: 0.25 }}>
                      View Invoice
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                      Click to open invoice in a new tab
                    </Typography>
                  </Box>
                  <ExternalLink size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                </Box>
              </>
            )}
          </Box>

          {/* Notes (Collapsible) - Fixed height */}
          <Box sx={{ mb: 3, minHeight: job.notes ? '50px' : '0px' }}>
            {job.notes && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                  onClick={() => setNotesExpanded(!notesExpanded)}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Job Notes
                  </Typography>
                  {notesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Box>
                <Collapse in={notesExpanded}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                      {job.notes}
                    </Typography>
                  </Box>
                </Collapse>
              </>
            )}
          </Box>

          {/* Status Selector */}
          <Box>
            <Select
              value={displayStatus || job?.status}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="z-[1400]">
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

      {statusChangeDialogOpen && pendingStatus && (
        <StatusChangeConfirmationDialog
          job={job}
          newStatus={pendingStatus}
          open={statusChangeDialogOpen}
          onClose={handleCancelStatusChange}
          onConfirm={handleConfirmStatusChange}
          isUpdating={updating}
        />
      )}
    </>
  )
}
