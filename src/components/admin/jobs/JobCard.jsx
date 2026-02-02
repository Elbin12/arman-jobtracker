"use client"

import { useState, useEffect } from "react"
import moment from "moment-timezone"
import { useUpdateJobMutation } from "../../../store/api/jobsApi"
import { useToast } from "@/hooks/use-toast"
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
import { JobCompletionDetails } from "./JobCompletionDetails"
import { ImageViewer } from "@/components/ui/ImageViewer"

export function JobCard({ job, onUpdate, onEdit, onDelete, users = [], accountTimezone = "America/Chicago" }) {
  const [updating, setUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [displayStatus, setDisplayStatus] = useState(job?.status)
  const [selectedImage, setSelectedImage] = useState(null)
  const [updateJob] = useUpdateJobMutation()
  const { toast } = useToast()

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

    // Validation: Prevent changing from pending to confirmed if slot is reserved
    if (job?.status === "pending" && newStatus === "confirmed" && job?.slot_reserved_info?.slot_reserved === true) {
      toast({
        title: "Cannot Change Status",
        description: "This slot is reserved. You cannot change the status from Pending to Confirmed.",
        variant: "destructive",
      })
      // Reset display status to current job status
      setDisplayStatus(job?.status)
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
      return
    }
    
    setUpdating(true)
    try {
      const result = await updateJob({
        id: jobId,
        status: newStatus,
      }).unwrap()
      
      // Update display status first
      setDisplayStatus(newStatus)
      
      // Close the status change dialog
      setStatusChangeDialogOpen(false)
      setPendingStatus(null)
      
      // Update the job data via onUpdate callback
      if (onUpdate) {
        onUpdate(result)
      }
      
      // Small delay to ensure dialog closes before any other updates
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      // Keep dialog open on error so user can retry
      toast({
        title: "Error",
        description: "Failed to update job status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirmStatusChange = async () => {
    if (pendingStatus) {
      // For completed status, the completion form handles images and payment method
      // and then calls this to update the status
      await updateJobStatus(pendingStatus)
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
        if (assignment.user) {
          if (assignment.first_name || assignment.last_name) {
            const fullName = `${assignment.first_name || ""} ${assignment.last_name || ""}`.trim()
            return toTitleCase(fullName)
          } else if (assignment.email) {
            return assignment.email
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
          {/* Header - Responsive height */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            mb: 2,
            minHeight: { xs: 'auto', sm: '64px' }, // Responsive minimum height
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
                  minHeight: { xs: 'auto', sm: '32px' }, // Responsive minimum height
                }}
              >
                {job.title || "Untitled Job"}
              </Typography>
              {/* Company Name - Highlighted if exists */}
              {job.contact_details?.company_name ? (
                <>
                  <Box sx={{ mb: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary', 
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      Business Name
                    </Typography>
                    {job.ghl_contact_id ? (
                      <Typography 
                        component="a"
                        href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${job.ghl_contact_id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body1" 
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600,
                          lineHeight: 1.3,
                          minHeight: { xs: 'auto', sm: '24px' },
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'block',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {toTitleCase(job.contact_details.company_name)}
                      </Typography>
                    ) : (
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'text.primary', 
                          fontWeight: 600,
                          lineHeight: 1.3,
                          minHeight: { xs: 'auto', sm: '24px' },
                        }}
                      >
                        {toTitleCase(job.contact_details.company_name)}
                      </Typography>
                    )}
                  </Box>
                  {/* Contact Name - Secondary */}
                  {job.customer_name && (
                    <Typography 
                      component="a"
                      href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${job.ghl_contact_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        fontWeight: 400,
                        lineHeight: 1.3,
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: 'text.primary',
                        },
                      }}
                    >
                      {toTitleCase(job.customer_name)}
                    </Typography>
                  )}
                </>
              ) : (
                /* Fallback to customer_name if no company_name */
                job.customer_name && job.ghl_contact_id ? (
                  <Typography 
                    component="a"
                    href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${job.ghl_contact_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body1" 
                    sx={{ 
                      color: 'primary.main', 
                      fontWeight: 500,
                      lineHeight: 1.3,
                      minHeight: { xs: 'auto', sm: '24px' },
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {toTitleCase(job.customer_name)}
                  </Typography>
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 500,
                      lineHeight: 1.3,
                      minHeight: { xs: 'auto', sm: '24px' },
                    }}
                  >
                    {job.customer_name ? toTitleCase(job.customer_name) : '\u00A0'}
                  </Typography>
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <IconButton 
                size="small" 
                onClick={() => onEdit(job)} 
                title="Edit job"
                aria-label="Edit job"
                sx={{ 
                  color: 'text.secondary',
                  minWidth: { xs: '44px', sm: 'auto' },
                  minHeight: { xs: '44px', sm: 'auto' },
                }}
              >
                <Edit size={18} />
              </IconButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton 
                    size="small" 
                    title="More options"
                    aria-label="More options"
                    sx={{ 
                      color: 'text.secondary',
                      minWidth: { xs: '44px', sm: 'auto' },
                      minHeight: { xs: '44px', sm: 'auto' },
                    }}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[1300]">
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                  {/* Add Duplicate and Archive options here if needed */}
                </DropdownMenuContent>
              </DropdownMenu>
            </Box>
          </Box>

          {/* Status Badges - Responsive height */}
          <Box sx={{ 
            display: "flex", 
            gap: 1, 
            mb: 3, 
            flexWrap: "wrap",
            minHeight: { xs: 'auto', sm: '32px' }, // Responsive minimum height
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
              
              {/* Company Name - Highlighted if exists */}
              {job.contact_details?.company_name ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <User size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary', 
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          lineHeight: 1,
                        }}
                      >
                        Business Name
                      </Typography>
                      {job.ghl_contact_id ? (
                        <Typography 
                          component="a"
                          href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${job.ghl_contact_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            color: 'primary.main',
                            fontWeight: 600,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {toTitleCase(job.contact_details.company_name)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {toTitleCase(job.contact_details.company_name)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {/* Contact Name - Secondary */}
                  {job.customer_name && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: '24px' }}>
                      {job.ghl_contact_id ? (
                        <Typography 
                          component="a"
                          href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${job.ghl_contact_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8125rem',
                            color: 'text.secondary',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'text.primary',
                            },
                          }}
                        >
                          {toTitleCase(job.customer_name)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                          {toTitleCase(job.customer_name)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                /* Fallback to customer_name if no company_name */
                job.customer_name && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <User size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                    {job.ghl_contact_id ? (
                      <Typography 
                        component="a"
                        href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${job.ghl_contact_id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.875rem',
                          color: 'primary.main',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {toTitleCase(job.customer_name)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {toTitleCase(job.customer_name)}
                      </Typography>
                    )}
                  </Box>
                )
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
                        `${import.meta.env.VITE_GOOGLE_MAPS_SEARCH_URL || 'https://www.google.com/maps/search/?api=1&query='}${encodeURIComponent(job.customer_address)}`,
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
          
          {job?.submission &&
            <Box sx={{ mb: 3 }}>
              <Box
                component="a"
                href={`/quote/details/${job.submission}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "primary.200",
                  border: "1px solid",
                  borderColor: "divider",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 1,
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main", mb: 0.25 }}>
                  View Approved Estimate
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                  Click to open job in a new tab
                </Typography>
              </Box>
            </Box>
          }

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

          {/* Appointment Details - Show when slot is reserved and appointment exists */}
          {job?.slot_reserved_info?.slot_reserved === true && job?.slot_reserved_info?.appointment && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 1.5, display: 'block', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                Reserved Appointment
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "info.50",
                  border: "1px solid",
                  borderColor: "info.200",
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {job.slot_reserved_info.appointment.title && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "info.main", mb: 0.5 }}>
                      {job.slot_reserved_info.appointment.title}
                    </Typography>
                  )}

                  {job.slot_reserved_info.appointment.start_time && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Calendar size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {moment.utc(job.slot_reserved_info.appointment.start_time).tz(accountTimezone).format("MMM D, YYYY · h:mm A")}
                        {job.slot_reserved_info.appointment.end_time && (
                          <> - {moment.utc(job.slot_reserved_info.appointment.end_time).tz(accountTimezone).format("h:mm A")}</>
                        )}
                      </Typography>
                    </Box>
                  )}

                  {job.slot_reserved_info.appointment.assigned_user && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <User size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {job.slot_reserved_info.appointment.assigned_user.name}
                        {job.slot_reserved_info.appointment.assigned_user.email && (
                          <> ({job.slot_reserved_info.appointment.assigned_user.email})</>
                        )}
                      </Typography>
                    </Box>
                  )}

                  {job.slot_reserved_info.appointment.contact && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <User size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {job.slot_reserved_info.appointment.contact.name}
                        {job.slot_reserved_info.appointment.contact.email && (
                          <> ({job.slot_reserved_info.appointment.contact.email})</>
                        )}
                      </Typography>
                    </Box>
                  )}

                  {job.slot_reserved_info.appointment.address && (
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <MapPin size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0, marginTop: '2px' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {job.slot_reserved_info.appointment.address}
                      </Typography>
                    </Box>
                  )}

                  {job.slot_reserved_info.appointment.calendar_name && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Calendar size={16} style={{ color: 'rgba(0, 0, 0, 0.54)', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                        Calendar: {job.slot_reserved_info.appointment.calendar_name}
                      </Typography>
                    </Box>
                  )}

                  {job.slot_reserved_info.appointment.appointment_status && (
                    <Box>
                      <Chip
                        label={job.slot_reserved_info.appointment.appointment_status.replace(/_/g, " ")}
                        size="small"
                        sx={{
                          textTransform: "capitalize",
                          fontSize: "0.75rem",
                          height: "24px",
                          fontWeight: 500,
                        }}
                        color={job.slot_reserved_info.appointment.appointment_status === "confirmed" ? "success" : "default"}
                      />
                    </Box>
                  )}

                  {job.slot_reserved_info.appointment.notes && (
                    <Box sx={{ mt: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'info.200' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Notes:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                        {job.slot_reserved_info.appointment.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* Completion Details - Show for all jobs */}
            <JobCompletionDetails 
              job={job} 
              onUpdate={onUpdate} 
              onImageClick={(image) => setSelectedImage(image)}
            />

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
              <SelectContent className="z-[1300]">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem 
                  value="confirmed"
                  disabled={job?.status === "pending" && job?.slot_reserved_info?.slot_reserved === true}
                >
                  Confirmed
                </SelectItem>
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

      {/* Image Viewer */}
      <ImageViewer
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage}
        showCaption={true}
      />
    </>
  )
}
