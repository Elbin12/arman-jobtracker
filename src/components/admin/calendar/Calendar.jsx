import { useState, useEffect, useRef } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import moment from "moment-timezone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// Custom styles to prevent calendar width overflow and improve event styling
const calendarStyles = `
  .rbc-calendar {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  .rbc-month-view {
    width: 100% !important;
    max-width: 100% !important;
  }
  .rbc-month-row {
    width: 100% !important;
    max-width: 100% !important;
  }
  .rbc-day-bg {
    width: 100% !important;
  }
  .rbc-header {
    width: 100% !important;
  }
  .rbc-event {
    border-radius: 8px !important;
    padding: 0 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    transition: all 0.2s ease !important;
    overflow: hidden !important;
  }
  .rbc-event-wrapper {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    border-radius: 8px !important;
    overflow: hidden !important;
  }
  .rbc-event:hover {
    box-shadow: none !important;
    transform: translateY(-1px);
    border: none !important;
    outline: none !important;
  }
  .rbc-event:hover .rbc-event-content {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
  }
  .rbc-event-content {
    line-height: 1.4 !important;
    overflow: visible !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    border: none !important;
    outline: none !important;
    padding: 6px 10px !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    min-height: 28px !important;
    display: flex !important;
    align-items: center !important;
  }
  .rbc-event-label {
    display: none !important;
  }
  .rbc-day-slot .rbc-time-slot {
    border-top: none !important;
  }
  .rbc-time-slot {
    border-top: 1px solid #f0f0f0 !important;
  }
  .rbc-event-selected {
    border: none !important;
    outline: none !important;
  }
  .rbc-event:focus {
    border: none !important;
    outline: none !important;
  }
  .rbc-event.rbc-selected {
    border: none !important;
    outline: none !important;
  }
  .rbc-day-slot .rbc-event {
    border: none !important;
    outline: none !important;
    margin: 0 !important;
  }
  .rbc-month-view .rbc-event {
    border: none !important;
    outline: none !important;
    margin: 0 !important;
  }
  .rbc-month-view .rbc-day-slot .rbc-event {
    margin: 0 !important;
  }
  .rbc-day-slot .rbc-events-container {
    margin: 0 !important;
  }
  .rbc-day-slot .rbc-events-container .rbc-event {
    margin: 0 !important;
  }
  .rbc-day-bg {
    overflow: visible !important;
  }
  .rbc-day-slot {
    overflow: visible !important;
  }
  .rbc-date-cell {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-day-bg {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-day-slot {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-date-cell {
    overflow: visible !important;
  }
  .rbc-month-row {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-month-row {
    overflow: visible !important;
  }
  .rbc-row-content {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-row-content {
    overflow: visible !important;
  }
`;
import { JobCard } from "../jobs/JobCard";
import { jobsApi, useGetCalendarJobsQuery, useGetAppointmentsCalendarQuery, useGetJobDetailsQuery, useUpdateAppointmentMutation } from "../../../store/api/jobsApi";
import { useSelector, useDispatch } from "react-redux";
import { EditJobDialog } from "../jobs/EditJobDialog";
import { TimelineSidebar } from "./TimelineSidebar";
import { useUpdateJobMutation } from "../../../store/api/jobsApi";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

// Custom Event Component that accepts staff drops
function DroppableEvent({ event, title, style, onStaffDrop, onSelectEvent, ...props }) {
  // Handle "+X more" event type
  if (event?.type === 'more') {
    return (
      <div
        className="rbc-event"
        style={{
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          borderRadius: "8px",
          padding: "0",
          boxShadow: "none",
          margin: "0",
          cursor: "pointer",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectEvent) {
            onSelectEvent(event);
          }
        }}
        title={event?.title}
        {...props}
      >
        <div
          className="truncate"
          style={{
            lineHeight: "1.4",
            backgroundColor: "#e5e7eb",
            borderRadius: "8px",
            padding: "6px 10px",
            fontWeight: "500",
            fontSize: "13px",
            color: "#374151",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
          }}
        >
          {event?.title || "+more"}
        </div>
      </div>
    );
  }
  
  // Don't allow staff drops on appointments
  const isAppointment = event?.type === 'appointment';
  
  const [{ isOver }, drop] = useDrop({
    accept: "staff",
    drop: (item) => {
      if (onStaffDrop && event?.resource && !isAppointment) {
        onStaffDrop(event.resource, item.user);
      }
    },
    canDrop: () => !isAppointment,
    collect: (monitor) => ({
      isOver: monitor.isOver() && !isAppointment,
    }),
  });

  const eventStyle = style || {};
  const eventTitle = title || event?.title || "";
  
  // Get the background color from the event style (set by eventStyleGetter)
  // We need to extract it from the parent wrapper's computed style or pass it differently
  const resource = event?.resource;
  let backgroundColor = "#9ca3ef"; // Default
  
  if (event?.type === 'appointment') {
    const appointment = resource;
    switch (appointment?.appointment_status) {
      case "new":
        backgroundColor = "#9ca3ef";
        break;
      case "confirmed":
        backgroundColor = "#06b6d4";
        break;
      case "cancelled":
        backgroundColor = "#ef4444";
        break;
      case "completed":
        backgroundColor = "#10b981";
        break;
      default:
        backgroundColor = "#9ca3ef";
    }
  } else if (resource) {
    const job = resource;
    switch (job?.status) {
      case "scheduled":
        backgroundColor = "#9ca3ef";
        break;
      case "pending":
        backgroundColor = "#f59e0b";
        break;
      case "in_progress":
        backgroundColor = "#3b82f6";
        break;
      case "completed":
        backgroundColor = "#10b981";
        break;
      case "cancelled":
        backgroundColor = "#ef4444";
        break;
      default:
        backgroundColor = "#9ca3ef";
    }
  }

  // React-big-calendar applies styles from eventPropGetter to a wrapper div
  // We'll apply the background color and padding directly to our inner content div
  return (
    <div
      ref={drop}
      className={cn(
        "rbc-event",
        isOver && "rbc-event-droppable"
      )}
      style={{
        backgroundColor: "transparent",
        border: "none",
        outline: "none",
        borderRadius: "8px",
        padding: "0",
        boxShadow: "none",
        margin: "0",
      }}
      title={eventTitle}
      {...props}
    >
      <div 
        className="truncate" 
        style={{ 
          lineHeight: "1.4",
          backgroundColor: backgroundColor,
          borderRadius: "8px",
          padding: "6px 10px",
          fontWeight: "500",
          fontSize: "13px",
          color: "white",
          boxShadow: isOver ? "0 2px 6px rgba(0, 0, 0, 0.15)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s ease",
          border: isOver ? "2px dashed rgba(255, 255, 255, 0.8)" : "none",
        }}
      >
        {eventTitle}
      </div>
    </div>
  );
}

export function NewCalendar({ users = [], isLoadingUsers = false }) {
  const dispatch = useDispatch();
  const [updateJob] = useUpdateJobMutation();
  const [updateAppointment, { isLoading: isUpdatingAppointment }] = useUpdateAppointmentMutation();
  const [events, setEvents] = useState([]);
  const [originalEvents, setOriginalEvents] = useState([]); // Store original events for height calculation
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthRowHeight, setMonthRowHeight] = useState(140);
  const [expandedDays, setExpandedDays] = useState(new Set()); // Track which days are expanded
  const [showSidebar, setShowSidebar] = useState(true);
  // Initialize categories - both jobs and appointments checked by default
  const [selectedCategories, setSelectedCategories] = useState({
    jobs: true,
    appointments: true,
  });
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [filterParams, setFilterParams] = useState({});
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null);
  
  // Time picker dialog state for drag and drop
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [draggedJob, setDraggedJob] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState({ hour: "12", minute: "00", period: "PM" });
  const [isUpdatingTime, setIsUpdatingTime] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState(null); // Store original scheduled_at for undo
  const undoTimeoutRef = useRef(null);

  // Initialize all staff as unchecked when users are loaded (only on mount)
  const isInitialized = useRef(false);
  useEffect(() => {
    if (users.length > 0 && !isInitialized.current) {
      const initialAssignees = {};
      users.forEach((user) => {
        initialAssignees[user.id] = false; // All unchecked by default
      });
      setSelectedAssignees(initialAssignees);
      // Set filterParams to empty assignee_ids so no jobs show initially
      setFilterParams({ assignee_ids: '' });
      isInitialized.current = true;
    }
  }, [users.length]); // Only run when users array length changes

  // Sync selectedAssignees when filterParams.assignee_ids changes (from external sources)
  // Skip if this change came from our own handleAssigneeToggle
  const isInternalUpdate = useRef(false);
  useEffect(() => {
    if (filterParams.assignee_ids && users.length > 0 && !isInternalUpdate.current) {
      // Parse assignee_ids from filterParams (format: "1,2,3" or comma-separated string)
      const assigneeIdsStr = typeof filterParams.assignee_ids === 'string' 
        ? filterParams.assignee_ids.replace(/[\[\]]/g, '') 
        : '';
      const assigneeIds = assigneeIdsStr 
        ? assigneeIdsStr.split(',').map(id => {
            const trimmed = id.trim();
            // Support both numeric IDs and UUIDs/emails
            const numId = parseInt(trimmed);
            return isNaN(numId) ? trimmed : numId;
          }).filter(id => id !== '' && id !== null && id !== undefined)
        : [];
      
      // Update selectedAssignees based on filterParams
      const updatedAssignees = {};
      users.forEach((user) => {
        const userId = user.id || user.email;
        updatedAssignees[user.id] = assigneeIds.some(id => 
          id === user.id || id === userId || id === user.email
        );
      });
      setSelectedAssignees(updatedAssignees);
    }
    isInternalUpdate.current = false;
  }, [filterParams.assignee_ids, users.length]);

  const user_profile = useSelector((state) => state.auth.user_profile)
  const user = useSelector((state) => state.auth.user)
  const userRole = user?.role || "worker"
  const accountTimezone = user_profile?.account?.timezone || "America/Chicago";
  
  // Check if user can see staff section (admin, manager, supervisor)
  const canViewStaff = ["admin", "manager", "supervisor"].includes(userRole);

  const getDateRange = () => {
    let start, end;

    if (view === "month") {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59);
    } else if (view === "week") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      start = weekStart;
      end = weekEnd;
    } else if (view === "day") {
      // Create new Date objects to avoid mutating currentDate
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const { start, end } = getDateRange();
  
  // Build filter params for calendar jobs API
  // API expects: start, end, status (comma-separated), job_ids, assignee_ids (comma-separated), search
  const calendarJobsParams = {
    start,
    end,
  };
  
  // Job status - support both single and comma-separated values
  if (filterParams.job_status && filterParams.job_status.trim()) {
    calendarJobsParams.status = filterParams.job_status;
  } else if (filterParams.status && filterParams.status.trim()) {
    // Legacy support
    calendarJobsParams.status = filterParams.status;
  }
  
  // Job IDs filter
  if (filterParams.job_ids && filterParams.job_ids.trim()) {
    calendarJobsParams.job_ids = filterParams.job_ids;
  }
  
  // Assignee IDs - convert from array format to comma-separated string
  if (filterParams.assignee_ids) {
    if (typeof filterParams.assignee_ids === 'string') {
      const cleaned = filterParams.assignee_ids.replace(/[\[\]]/g, '');
      if (cleaned.trim()) {
        calendarJobsParams.assignee_ids = cleaned;
      }
    } else if (Array.isArray(filterParams.assignee_ids) && filterParams.assignee_ids.length > 0) {
      calendarJobsParams.assignee_ids = filterParams.assignee_ids.join(',');
    }
  }
  
  // Search - prioritize job_search, fallback to general search
  if (filterParams.job_search && filterParams.job_search.trim()) {
    calendarJobsParams.search = filterParams.job_search;
  } else if (filterParams.search && filterParams.search.trim()) {
    calendarJobsParams.search = filterParams.search;
  }
  
  // Build filter params for appointments API
  // API expects: start, end, status (comma-separated), assigned_user_ids (comma-separated), search
  const appointmentsParams = {
    start,
    end,
  };
  
  // Appointment status - support comma-separated values
  if (filterParams.appointment_status && filterParams.appointment_status.trim()) {
    appointmentsParams.status = filterParams.appointment_status;
  }
  
  // Assigned user IDs - convert from array format to comma-separated string
  if (filterParams.assigned_user_ids) {
    if (typeof filterParams.assigned_user_ids === 'string') {
      const cleaned = filterParams.assigned_user_ids.replace(/[\[\]]/g, '');
      if (cleaned.trim()) {
        appointmentsParams.assigned_user_ids = cleaned;
      }
    } else if (Array.isArray(filterParams.assigned_user_ids) && filterParams.assigned_user_ids.length > 0) {
      appointmentsParams.assigned_user_ids = filterParams.assigned_user_ids.join(',');
    }
  }
  
  // Search - prioritize appointment_search
  if (filterParams.appointment_search && filterParams.appointment_search.trim()) {
    appointmentsParams.search = filterParams.appointment_search;
  } else if (filterParams.search && filterParams.search.trim()) {
    // Only use general search for appointments if no appointment_search is set
    appointmentsParams.search = filterParams.search;
  }
  
  const { data: calendarJobs, isLoading, isFetching } = useGetCalendarJobsQuery(calendarJobsParams);
  const { data: appointments, isLoading: isLoadingAppointments, isFetching: isFetchingAppointments } = useGetAppointmentsCalendarQuery(appointmentsParams);
  
  // New API returns array directly, not wrapped in results
  const jobs = Array.isArray(calendarJobs) ? calendarJobs : [];
  
  // Handle both array response and results-wrapped response for appointments
  const appointmentsList = Array.isArray(appointments) 
    ? appointments 
    : (appointments?.results ?? []);
  
  // State for fetching job details when clicked
  const [selectedJobId, setSelectedJobId] = useState(null);
  const { data: jobDetails, isLoading: isLoadingJobDetails } = useGetJobDetailsQuery(
    selectedJobId,
    { skip: !selectedJobId }
  );

  useEffect(() => {
    // Check if categories are enabled (default to true if not set)
    const showJobs = selectedCategories.jobs !== false;
    const showAppointments = selectedCategories.appointments !== false;

    // Transform jobs to events (only if jobs category is enabled)
    // New API returns job_id instead of id, and includes series_id
    const jobEvents = showJobs
      ? jobs
          .filter((job) => {
            if (!job.scheduled_at) return false;
            return true;
          })
          .map((job) => {
            // Parse as UTC and create Date object with UTC time components as local time
            // This ensures the calendar displays the UTC time directly without conversion
            const m = moment.utc(job.scheduled_at);
            const startDate = new Date(m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second());
            const duration = parseFloat(job.duration_hours) || 2;
            const endDate = new Date(m.year(), m.month(), m.date(), m.hour() + duration, m.minute(), m.second());
            const timeStr = m.format("h A");
            // Check if it's part of a recurring series
            const recurringIndicator = job.series_id ? " (R)" : "";

            return {
              id: job.job_id, // Use job_id from new API
              title: `${timeStr} ${job.customer_name || "Customer"}${recurringIndicator}`,
              start: startDate,
              end: endDate,
              resource: {
                ...job,
                id: job.job_id, // Map job_id to id for compatibility
              },
              type: 'job',
            };
          })
      : [];

    // Transform appointments to events (only if appointments category is enabled)
    const appointmentEvents = showAppointments
      ? appointmentsList
          .filter((appointment) => {
            if (!appointment.start_time) return false;
            return true;
          })
          .map((appointment) => {
            // Parse as UTC and convert to America/Chicago timezone for display
            const startM = moment.utc(appointment.start_time).tz("America/Chicago");
            const endM = moment.utc(appointment.end_time).tz("America/Chicago");
            const startDate = new Date(startM.year(), startM.month(), startM.date(), startM.hour(), startM.minute(), startM.second());
            const endDate = new Date(endM.year(), endM.month(), endM.date(), endM.hour(), endM.minute(), endM.second());
            const timeStr = startM.format("h A");

            return {
              id: appointment.appointment_id,
              title: `${timeStr} ${appointment.title || appointment.contact_name || "Appointment"}`,
              start: startDate,
              end: endDate,
              resource: appointment,
              type: 'appointment',
            };
          })
      : [];

    // Merge both events
    const allEvents = [...jobEvents, ...appointmentEvents];
    
    // Store original events for height calculation
    setOriginalEvents(allEvents);
    
    // Show all events - no limiting, height will adjust dynamically
    setEvents(allEvents);
  }, [jobs, appointmentsList, accountTimezone, selectedCategories]);

  // Dynamically set month row height so all events fit
  useEffect(() => {
    if (view !== "month") return;

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count actual events per day using local date components
    const counts = {};
    originalEvents.forEach((ev) => {
      const d = ev.start;
      if (d >= monthStart && d <= monthEnd) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        const dayKey = `${year}-${month}-${date}`;
        counts[dayKey] = (counts[dayKey] || 0) + 1;
      }
    });

    // Find the day with the most events - this determines the row height needed
    const maxCount = Object.values(counts).reduce((a, b) => Math.max(a, b), 0);
    
    // Calculate height dynamically based on number of events
    // Each event needs: padding (6px top + 6px bottom = 12px) + content height (~20px) = ~32px per event
    const eventHeight = 32; // Height per event
    const baseHeight = 44; // Base height for day cell (date number + padding)
    
    // Use the maximum event count to calculate height - show all events
    const calculatedHeight = baseHeight + (Math.max(maxCount, 1) * eventHeight);
    
    // Set minimum height, but always use calculated height if it's larger
    const minHeight = 140;
    setMonthRowHeight(Math.max(minHeight, calculatedHeight));
  }, [originalEvents, view, currentDate]);

  const weeksInMonth =
    view === "month"
      ? Math.ceil(
          (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() +
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()) /
            7
        )
      : 0;

  const weekDayHeight = () => {
    if (view === "month") {
      return 64 + weeksInMonth * monthRowHeight;
    }
    const hours = 18;
    const pixelsPerHour = 60;
    return 100 + hours * pixelsPerHour;
  };

  const monthTotalHeight = weekDayHeight();

  const handleSelectEvent = (event) => {
    if (event.type === 'appointment') {
      setSelectedAppointment(event.resource);
      setSelectedJob(null);
      setSelectedJobId(null);
    } else {
      // For jobs, fetch full job details using job_id
      const jobId = event.resource.job_id || event.resource.id;
      if (jobId) {
        setSelectedJobId(jobId);
        setSelectedAppointment(null);
      }
    }
  };
  
  // Update selectedJob when jobDetails is loaded
  useEffect(() => {
    if (jobDetails && selectedJobId) {
      setSelectedJob(jobDetails);
    }
  }, [jobDetails, selectedJobId]);

  const handleToggleExpand = (dayKey) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const navigateBack = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const getDateTitle = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    switch (view) {
      case "month":
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case "week":
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
      case "day":
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      default:
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  const eventStyleGetter = (event) => {
    // Handle appointments differently
    if (event.type === 'appointment') {
      const appointment = event.resource;
      let backgroundColor = "#a78bfa"; // Light purple-blue for appointments

      switch (appointment.appointment_status) {
        case "new":
          backgroundColor = "#9ca3ef"; // Light purple-blue (matching the design)
          break;
        case "confirmed":
          backgroundColor = "#06b6d4"; // Cyan
          break;
        case "cancelled":
          backgroundColor = "#ef4444"; // Red
          break;
        case "completed":
          backgroundColor = "#10b981"; // Green (matching the design)
          break;
        default:
          backgroundColor = "#9ca3ef";
      }

      return {
        style: {
          backgroundColor: "transparent",
          borderRadius: "8px",
          opacity: 1,
          color: "white",
          border: "none",
          outline: "none",
          fontSize: "13px",
          fontWeight: "500",
          padding: "0",
          boxShadow: "none",
        },
      };
    }

    // Handle jobs
    const job = event.resource;
    let backgroundColor = "#9ca3ef"; // Default light purple-blue (softer tone)

    switch (job.status) {
      case "scheduled":
        backgroundColor = "#9ca3ef"; // Light purple-blue (matching the design)
        break;
      case "pending":
        backgroundColor = "#f59e0b"; // Yellow/Orange
        break;
      case "in_progress":
        backgroundColor = "#3b82f6"; // Blue
        break;
      case "completed":
        backgroundColor = "#10b981"; // Green (matching the design)
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // Red
        break;
    }

    return {
      style: {
        backgroundColor: "transparent",
        borderRadius: "8px",
        opacity: 1,
        color: "white",
        border: "none",
        outline: "none",
        fontSize: "13px",
        fontWeight: "500",
        padding: "0",
        boxShadow: "none",
      },
    };
  };

  const handleEdit = () => {
    setEditingJob(selectedJob);
    setEditDialogOpen(true)
    setSelectedJob(null)
  }

  const handleDeleteJob = (jobToDelete, option) => {
    // let updatedJobs = jobs

    // if (option === "sequence" && jobToDelete.is_recurring) {
    //   updatedJobs = jobs.filter(
    //     (j) =>
    //       !(j.customer_name === jobToDelete.customer_name && j.job_type === jobToDelete.job_type && j.is_recurring),
    //   )
    // } else {
    //   updatedJobs = jobs.filter((j) => j.id !== jobToDelete.id)
    // }
  }

  const handleJobUpdate = (result) => {
    // Update the cache for the calendar jobs query
    // New API returns array directly, not wrapped in results
    dispatch(
      jobsApi.util.updateQueryData(
        "getCalendarJobs",
        calendarJobsParams,
        (draft) => {
          if (Array.isArray(draft)) {
            const index = draft.findIndex(j => j.job_id === result.id || j.job_id === result.job_id);
            if (index !== -1) {
              // Update the occurrence with new data
              draft[index] = {
                ...draft[index],
                ...result,
                job_id: result.id || result.job_id,
              };
            }
          }
        }
      )
    );
    
    // If this is the selected job, update it
    if (selectedJob && (selectedJob.id === result.id || selectedJob.job_id === result.id || selectedJob.job_id === result.job_id)) {
      setSelectedJob(result);
    }
  }

  // Handle event drop (drag and drop)
  const handleEventDrop = ({ event, start, end }) => {
    // Don't allow dragging appointments
    if (event.type === 'appointment') return;
    
    const job = event.resource;
    if (!job) return;

    // Get job_id from the resource (new API uses job_id)
    const jobId = job.job_id || job.id;
    if (!jobId) return;

    // Get original job date (parse as UTC to show time directly from API)
    const originalMoment = moment.utc(job.scheduled_at);
    const originalDate = originalMoment.format("YYYY-MM-DD");
    const newDateStr = moment(start).format("YYYY-MM-DD");

    // Extract date/time components from start
    const startDate = new Date(start);
    const dateStr = moment(startDate).format("YYYY-MM-DD");
    const timeStr = moment(startDate).format("HH:mm:ss");
    
    // Create moment in account timezone with the extracted date/time, then convert to UTC
    const localMoment = moment.tz(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss", accountTimezone);
    const newScheduledAt = localMoment.utc().toISOString();

    // In week and day views, directly update since user can see and drag to specific time slots
    // In month view, show time picker when dragging to different date
    if (view === "week" || view === "day") {
      // Week/day view: directly update with the new time (store original for undo)
      updateJobTime({ ...job, id: jobId }, newScheduledAt, job.scheduled_at);
    } else {
      // Month view: show time picker if dropped on different date
      if (originalDate !== newDateStr) {
        // Show time picker dialog
        setDraggedJob({ ...job, id: jobId });
        setNewDate(moment(start).toDate());
        // Set initial time from the drop position
        const hours = localMoment.hour();
        const hour12 = hours % 12 || 12;
        setSelectedTime({
          hour: hour12.toString(),
          minute: localMoment.format("mm"),
          period: hours >= 12 ? "PM" : "AM"
        });
        setTimePickerOpen(true);
      } else {
        // Same date in month view, just update time (store original for undo)
        updateJobTime({ ...job, id: jobId }, newScheduledAt, job.scheduled_at);
      }
    }
  };

  // Handle event resize (change duration and/or start time)
  const handleEventResize = ({ event, start, end }) => {
    // Don't allow resizing appointments
    if (event.type === 'appointment') return;
    
    const job = event.resource;
    if (!job) return;

    // Get job_id from the resource (new API uses job_id)
    const jobId = job.job_id || job.id;
    if (!jobId) return;

    // Calculate duration in hours from start and end times
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate - startDate;
    const durationHours = durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
    
    // Round to 2 decimal places for cleaner values
    const roundedDuration = Math.round(durationHours * 100) / 100;

    // Check if start time changed (resizing from left edge) - parse as UTC to show time directly from API
    const originalMoment = moment.utc(job.scheduled_at);
    const originalStart = originalMoment.toDate();
    const startChanged = Math.abs(startDate.getTime() - originalStart.getTime()) > 60000; // More than 1 minute difference

    if (startChanged) {
      // Start time changed, update both scheduled_at and duration
      const dateStr = moment(startDate).format("YYYY-MM-DD");
      const timeStr = moment(startDate).format("HH:mm:ss");
      const localMoment = moment.tz(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss", accountTimezone);
      const newScheduledAt = localMoment.utc().toISOString();
      
      updateJobTimeAndDuration({ ...job, id: jobId }, newScheduledAt, roundedDuration);
    } else {
      // Only duration changed (resizing from right edge)
      updateJobDuration({ ...job, id: jobId }, roundedDuration);
    }
  };

  // Update job time
  const updateJobTime = async (job, newScheduledAt, originalScheduledAt = null) => {
    try {
      // Store original for undo if not provided
      const original = originalScheduledAt || job.scheduled_at;
      
      const result = await updateJob({
        id: job.id,
        scheduled_at: newScheduledAt,
      }).unwrap();
      
      handleJobUpdate(result);
      
      // Store update info for undo
      setLastUpdateInfo({
        jobId: job.id,
        originalScheduledAt: original,
        newScheduledAt: newScheduledAt,
        job: job
      });
      
      // Auto-dismiss undo notification after 10 seconds
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setLastUpdateInfo(null);
      }, 10000);
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  // Update job duration
  const updateJobDuration = async (job, durationHours) => {
    try {
      // Store original for undo
      const originalScheduledAt = job.scheduled_at;
      const originalDuration = job.duration_hours;
      
      // Ensure minimum duration of 0.5 hours
      const newDuration = Math.max(0.5, durationHours);
      
      const result = await updateJob({
        id: job.id,
        duration_hours: newDuration,
      }).unwrap();
      
      handleJobUpdate(result);
      
      // Store update info for undo (we'll restore both scheduled_at and duration)
      setLastUpdateInfo({
        jobId: job.id,
        originalScheduledAt: originalScheduledAt,
        originalDuration: originalDuration,
        newScheduledAt: result.scheduled_at,
        newDuration: newDuration,
        job: job
      });
      
      // Auto-dismiss undo notification after 10 seconds
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setLastUpdateInfo(null);
      }, 10000);
    } catch (error) {
      console.error("Failed to update job duration:", error);
    }
  };

  // Update job time and duration
  const updateJobTimeAndDuration = async (job, newScheduledAt, durationHours) => {
    try {
      // Store original for undo
      const originalScheduledAt = job.scheduled_at;
      const originalDuration = job.duration_hours;
      
      // Ensure minimum duration of 0.5 hours
      const newDuration = Math.max(0.5, durationHours);
      
      const result = await updateJob({
        id: job.id,
        scheduled_at: newScheduledAt,
        duration_hours: newDuration,
      }).unwrap();
      
      handleJobUpdate(result);
      
      // Store update info for undo
      setLastUpdateInfo({
        jobId: job.id,
        originalScheduledAt: originalScheduledAt,
        originalDuration: originalDuration,
        newScheduledAt: newScheduledAt,
        newDuration: newDuration,
        job: job
      });
      
      // Auto-dismiss undo notification after 10 seconds
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setLastUpdateInfo(null);
      }, 10000);
    } catch (error) {
      console.error("Failed to update job time and duration:", error);
    }
  };

  // Handle time picker confirmation
  const handleTimePickerConfirm = async () => {
    if (!draggedJob || !newDate || isUpdatingTime) return;

    // Store original scheduled_at for undo
    const originalScheduledAt = draggedJob.scheduled_at;

    // Convert 12-hour to 24-hour format
    let hour24 = parseInt(selectedTime.hour);
    if (selectedTime.period === "PM" && hour24 !== 12) hour24 += 12;
    if (selectedTime.period === "AM" && hour24 === 12) hour24 = 0;

    // Create datetime in account timezone, then convert to UTC
    const dateStr = moment(newDate).format("YYYY-MM-DD");
    const timeStr = `${String(hour24).padStart(2, '0')}:${selectedTime.minute}:00`;
    
    // Create moment in account timezone
    const localMoment = moment.tz(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss", accountTimezone);
    
    // Convert to UTC and format as UTC ISO string
    const newScheduledAt = localMoment.utc().toISOString();
    
    setIsUpdatingTime(true);
    
    try {
      await updateJobTime(draggedJob, newScheduledAt);
      
      // Store update info for undo
      setLastUpdateInfo({
        jobId: draggedJob.id,
        originalScheduledAt: originalScheduledAt,
        newScheduledAt: newScheduledAt,
        job: draggedJob
      });
      
      // Auto-dismiss undo notification after 10 seconds
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setLastUpdateInfo(null);
      }, 10000);
      
      // Close dialog and reset state after a brief delay to show success
      setTimeout(() => {
        setTimePickerOpen(false);
        setDraggedJob(null);
        setNewDate(null);
        setIsUpdatingTime(false);
      }, 500);
    } catch (error) {
      setIsUpdatingTime(false);
      console.error("Failed to update job time:", error);
    }
  };

  // Handle undo time change
  const handleUndoTimeChange = async () => {
    if (!lastUpdateInfo || isUpdatingTime) return;
    
    setIsUpdatingTime(true);
    
    // Clear auto-dismiss timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    
    try {
      // Check if we need to restore duration as well
      if (lastUpdateInfo.originalDuration !== undefined) {
        // Restore both time and duration
        const result = await updateJob({
          id: lastUpdateInfo.job.id,
          scheduled_at: lastUpdateInfo.originalScheduledAt,
          duration_hours: lastUpdateInfo.originalDuration,
        }).unwrap();
        handleJobUpdate(result);
      } else {
        // Only restore scheduled_at
        await updateJobTime(lastUpdateInfo.job, lastUpdateInfo.originalScheduledAt, lastUpdateInfo.newScheduledAt);
      }
      setLastUpdateInfo(null);
      setIsUpdatingTime(false);
    } catch (error) {
      setIsUpdatingTime(false);
      console.error("Failed to undo time change:", error);
    }
  };

  // Handle staff drop on job event
  const handleStaffDrop = async (job, user) => {
    if (!job || !user) return;
    
    // Don't allow staff drops on appointments
    if (job.appointment_id) return;

    // Get job_id from the resource (new API uses job_id)
    const jobId = job.job_id || job.id;
    if (!jobId) return;

    // Check if user is already assigned
    const isAlreadyAssigned = job.assignments?.some(
      (assignment) => assignment.user === user.id
    );

    if (isAlreadyAssigned) {
      // User is already assigned, no need to update
      return;
    }

    try {
      // Get current assignments or empty array
      const currentAssignments = job.assignments || [];
      
      // Add new assignment
      const newAssignments = [
        ...currentAssignments,
        { user: user.id, role: "worker" },
      ];

      // Update job with new assignments using job_id
      const result = await updateJob({
        id: jobId,
        assignments: newAssignments,
      }).unwrap();

      handleJobUpdate(result);
    } catch (error) {
      console.error("Failed to add assignee to job:", error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const handleCategoryToggle = (categoryId, checked) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [categoryId]: checked,
    }));
  };

  const handleAssigneeToggle = (assigneeId, checked) => {
    const updatedAssignees = {
      ...selectedAssignees,
      [assigneeId]: checked,
    };
    setSelectedAssignees(updatedAssignees);
    
    // Convert selectedAssignees to assignee_ids - API expects comma-separated string
    const selectedIds = Object.keys(updatedAssignees)
      .filter((id) => updatedAssignees[id] === true)
      .map((id) => {
        // Support both numeric IDs and UUIDs/emails
        const numId = parseInt(id);
        return isNaN(numId) ? id : numId;
      });
    
    // Mark as internal update to prevent sync loop
    isInternalUpdate.current = true;
    
    const assigneeIdsString = selectedIds.length > 0 ? selectedIds.join(',') : '';
    
    // Update filterParams with assignee_ids for jobs AND assigned_user_ids for appointments
    // Both APIs should use the same selected team members
    setFilterParams((prev) => ({
      ...prev,
      assignee_ids: assigneeIdsString,
      assigned_user_ids: assigneeIdsString, // Also update appointments filter
    }));
  };

  // Handle appointment status update
  const handleAppointmentStatusChange = async (newStatus) => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) return;
    
    try {
      const result = await updateAppointment({
        id: selectedAppointment.appointment_id,
        appointment_status: newStatus,
      }).unwrap();
      
      // Update the local state with the new status
      setSelectedAppointment({
        ...selectedAppointment,
        appointment_status: newStatus,
      });
      
      // Manually update the appointments cache for immediate calendar update
      dispatch(
        jobsApi.util.updateQueryData(
          "getAppointmentsCalendar",
          appointmentsParams,
          (draft) => {
            if (Array.isArray(draft)) {
              const index = draft.findIndex(a => a.appointment_id === selectedAppointment.appointment_id);
              if (index !== -1) {
                draft[index] = {
                  ...draft[index],
                  appointment_status: newStatus,
                };
              }
            } else if (draft?.results) {
              const index = draft.results.findIndex(a => a.appointment_id === selectedAppointment.appointment_id);
              if (index !== -1) {
                draft.results[index] = {
                  ...draft.results[index],
                  appointment_status: newStatus,
                };
              }
            }
          }
        )
      );
    } catch (error) {
      console.error("Failed to update appointment status:", error);
    }
  };

  return (
    <>
    <style>{calendarStyles}</style>
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4 w-full overflow-hidden">
        <div className="flex gap-4 w-full min-w-0">
          {/* Left Sidebar */}
          {showSidebar && (
            <div className="flex-shrink-0">
            <TimelineSidebar
              currentDate={currentDate}
              onDateChange={(date) => setCurrentDate(date)}
              users={users}
              isLoadingUsers={isLoadingUsers}
              canViewStaff={canViewStaff}
              userRole={userRole}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              selectedAssignees={selectedAssignees}
              onAssigneeToggle={handleAssigneeToggle}
              filterParams={filterParams}
              onFilterChange={(field, value) => {
                setFilterParams((prev) => ({
                  ...prev,
                  [field]: value,
                }));
              }}
              jobs={jobs}
            />
            </div>
          )}

          {/* Main Calendar */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Calendar
              </CardTitle>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={navigateToday}>
                  Today
                </Button>
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" onClick={navigateBack} className="rounded-r-none border-r">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="font-semibold min-w-[180px] rounded-none">
                        {getDateTitle()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePicker
                        mode="single"
                        selected={currentDate}
                        onSelect={(date) => {
                          if (date) {
                            setCurrentDate(date);
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" onClick={navigateNext} className="rounded-l-none border-l">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Select value={view} onValueChange={(value) => setView(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month View</SelectItem>
                    <SelectItem value="week">Week View</SelectItem>
                    <SelectItem value="day">Day View</SelectItem>
                  </SelectContent>
                </Select>
                
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 relative w-full overflow-hidden">
            {(isLoading || isFetching || isLoadingAppointments || isFetchingAppointments) && (
              <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted-foreground">Loading calendar...</span>
                </div>
              </div>
            )}
            
            <div
              className="min-h-[320px] w-full max-w-full overflow-hidden"
              style={{
                height: view === "month" ? monthTotalHeight : "auto",
                ["--month-row-height"]: `${monthRowHeight}px`,
              }}
            >
              <div className="w-full h-full max-w-full overflow-hidden">
                <DnDCalendar
                  className="w-full max-w-full"
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={currentDate}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                resizable={(event) => event.type !== 'appointment' && event.type !== 'more'}
                eventPropGetter={eventStyleGetter}
                min={new Date(1970, 1, 1, 6, 0, 0)}
                max={new Date(1970, 1, 1, 23, 59, 59)}
                draggableAccessor={(event) => event.type !== 'appointment' && event.type !== 'more'}
                components={{
                  event: (props) => (
                    <DroppableEvent
                      {...props}
                      onStaffDrop={handleStaffDrop}
                      onSelectEvent={handleSelectEvent}
                    />
                  ),
                }}
                key={
                  view === "month"
                    ? `month-${currentDate.getFullYear()}-${currentDate.getMonth()}-${monthRowHeight}`
                    : `view-${view}`
                }
                style={{ height: view === "month" ? "100%" : "auto" }}
                popup={false}
                toolbar={false}
                formats={{
                  timeGutterFormat: "h A",
                  eventTimeRangeFormat: () => "",
                  agendaTimeRangeFormat: () => "",
                }}
              />
              </div>
            </div>
          </CardContent>
            </Card>
        </div>
        </div>
      </div>
    </DndProvider>

      <Dialog open={!!selectedJob || !!selectedJobId} onOpenChange={() => {
        setSelectedJob(null);
        setSelectedJobId(null);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>View and manage job information</DialogDescription>
          </DialogHeader>
          {isLoadingJobDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Loading job details...</span>
              </div>
            </div>
          ) : selectedJob ? (
            <JobCard
              job={selectedJob}
              onEdit={handleEdit}
              onDelete={handleDeleteJob}
              onUpdate={handleJobUpdate}
              users={users}
              accountTimezone={accountTimezone}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>View appointment information</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Title</Label>
                  <span className="text-sm">{selectedAppointment.title || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Contact</Label>
                  <span className="text-sm">{selectedAppointment.contact_name || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Assigned To</Label>
                  <span className="text-sm">{selectedAppointment.assigned_user_name || "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Status</Label>
                  <Select
                    value={selectedAppointment.appointment_status || "new"}
                    onValueChange={handleAppointmentStatusChange}
                    disabled={isUpdatingAppointment}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Start Time</Label>
                  <div className="text-sm">
                    {selectedAppointment.start_time 
                      ? moment.utc(selectedAppointment.start_time).tz("America/Chicago").format("MMMM D, YYYY h:mm A")
                      : "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">End Time</Label>
                  <div className="text-sm">
                    {selectedAppointment.end_time 
                      ? moment.utc(selectedAppointment.end_time).tz("America/Chicago").format("MMMM D, YYYY h:mm A")
                      : "N/A"}
                  </div>
                </div>
                {selectedAppointment.address && (
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Address</Label>
                    <div className="text-sm">{selectedAppointment.address}</div>
                  </div>
                )}
                {selectedAppointment.notes && (
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Notes</Label>
                    <div className="text-sm whitespace-pre-wrap">{selectedAppointment.notes}</div>
                  </div>
                )}
                {selectedAppointment.source && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Source</Label>
                    <span className="text-sm">{selectedAppointment.source}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Users Count</Label>
                  <span className="text-sm">{selectedAppointment.users_count || 0}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
        <EditJobDialog
          job={editingJob}
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedJob(editingJob);  // reopen JobCard
            setEditingJob(null);         // clear temporary
          }}
          users={users}
          handleJobUpdate={handleJobUpdate}
          accountTimezone={accountTimezone}
        />

      {/* Time Picker Dialog for Drag and Drop */}
      <Dialog 
        open={timePickerOpen} 
        onOpenChange={(open) => {
          if (!isUpdatingTime) {
            setTimePickerOpen(open);
            if (!open) {
              setDraggedJob(null);
              setNewDate(null);
              setIsUpdatingTime(false);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Time</DialogTitle>
            <DialogDescription>
              Choose the time for {draggedJob?.customer_name || draggedJob?.title || "this job"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="text-sm font-medium">
                {newDate ? moment(newDate).format("MMMM D, YYYY") : ""}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hour</Label>
                <Select
                  value={selectedTime.hour}
                  onValueChange={(value) => setSelectedTime({ ...selectedTime, hour: value })}
                  disabled={isUpdatingTime}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <SelectItem key={h} value={h.toString()}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minute</Label>
                <Select
                  value={selectedTime.minute}
                  onValueChange={(value) => setSelectedTime({ ...selectedTime, minute: value })}
                  disabled={isUpdatingTime}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={selectedTime.period}
                  onValueChange={(value) => setSelectedTime({ ...selectedTime, period: value })}
                  disabled={isUpdatingTime}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isUpdatingTime ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Updating schedule...</span>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTimePickerOpen(false);
                    setDraggedJob(null);
                    setNewDate(null);
                    setIsUpdatingTime(false);
                  }}
                  disabled={isUpdatingTime}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleTimePickerConfirm}
                  disabled={isUpdatingTime}
                  className="min-w-[100px]"
                >
                  {isUpdatingTime ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo Notification */}
      {lastUpdateInfo && !timePickerOpen && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Schedule updated successfully
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Time has been changed for this job
                </p>
              </div>
              <div className="flex-shrink-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndoTimeChange}
                  disabled={isUpdatingTime}
                  className="h-8 px-3"
                >
                  {isUpdatingTime ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Undo
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLastUpdateInfo(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}