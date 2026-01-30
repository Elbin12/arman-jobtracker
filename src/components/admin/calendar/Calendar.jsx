import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import moment from "moment-timezone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RotateCcw, CheckCircle2, Filter, X, Trash2, Plus, User, Phone, Mail, MapPin, PanelRightClose, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// Custom styles to prevent calendar width overflow and improve event styling
const calendarStyles = `
  .rbc-calendar {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    overflow-y: visible !important;
  }
  @media (max-width: 639px) {
    .rbc-calendar {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
  }
  .rbc-month-view {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 600px !important;
  }
  @media (min-width: 640px) {
    .rbc-month-view {
      min-width: 100% !important;
    }
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
    padding: 8px 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }
  @media (min-width: 640px) {
    .rbc-header {
      padding: 10px 8px !important;
      font-size: 14px !important;
    }
  }
  .rbc-date-cell {
    padding: 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }
  @media (min-width: 640px) {
    .rbc-date-cell {
      padding: 6px !important;
      font-size: 13px !important;
    }
  }
  .rbc-event {
    border-radius: 6px !important;
    padding: 0 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
    margin: 1px 0 !important;
    transition: all 0.2s ease !important;
    overflow: visible !important;
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  @media (min-width: 640px) {
    .rbc-event {
      margin: 2px 0 !important;
    }
  }
  @media (min-width: 1024px) {
    .rbc-event {
      margin: 2px 0 !important;
    }
  }
  .rbc-event-wrapper {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    border-radius: 6px !important;
    overflow: visible !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  .rbc-event-wrapper * {
    pointer-events: auto !important;
  }
  .rbc-event:hover {
    box-shadow: none !important;
    transform: translateY(-1px) !important;
    border: none !important;
    outline: none !important;
    z-index: 10 !important;
  }
  .rbc-event:hover .rbc-event-content {
    box-shadow: none !important;
  }
  .rbc-event-content {
    line-height: 1.3 !important;
    overflow: visible !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    border: none !important;
    outline: none !important;
    padding: 4px 6px !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    min-height: 20px !important;
    display: flex !important;
    align-items: center !important;
    font-size: 13px !important;
  }
  @media (min-width: 640px) {
    .rbc-event-content {
      padding: 5px 8px !important;
      min-height: 24px !important;
    }
  }
  @media (min-width: 1024px) {
    .rbc-event-content {
      padding: 6px 10px !important;
      min-height: 28px !important;
    }
  }
  .rbc-event-content-responsive {
    padding: 4px 6px !important;
    font-size: 13px !important;
    min-height: 20px !important;
    box-shadow: none !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  .rbc-event-content-responsive,
  .rbc-event-content-responsive span,
  .rbc-event-content-responsive * {
    font-size: 13px !important;
  }
  .rbc-event-content-responsive span,
  .rbc-event-content-responsive * {
    pointer-events: none !important;
  }
  @media (min-width: 640px) {
    .rbc-event-content-responsive {
      padding: 5px 8px !important;
      font-size: 13px !important;
      min-height: 24px !important;
    }
    .rbc-event-content-responsive,
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      font-size: 13px !important;
    }
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      pointer-events: none !important;
    }
  }
  @media (min-width: 1024px) {
    .rbc-event-content-responsive {
      padding: 6px 10px !important;
      font-size: 13px !important;
      min-height: 28px !important;
    }
    .rbc-event-content-responsive,
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      font-size: 13px !important;
    }
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      pointer-events: none !important;
    }
  }
  .rbc-event-content-responsive .recurring-indicator {
    font-size: 11px !important;
  }
  /* Mobile-specific improvements - Google Calendar style */
  @media (max-width: 639px) {
    .rbc-event {
      width: 100% !important;
      min-width: 100% !important;
      margin: 1px 0 !important;
      border-radius: 4px !important;
    }
  .rbc-event-wrapper {
    width: 100% !important;
    min-width: 100% !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
    .rbc-event-content-responsive {
      padding: 4px 6px !important;
      font-size: 10px !important;
      min-height: 20px !important;
      line-height: 1.2 !important;
      width: 100% !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      justify-content: center !important;
    }
    .rbc-event-content-responsive .truncate {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.2 !important;
      display: block !important;
      text-align: center !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      pointer-events: none !important;
    }
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      pointer-events: none !important;
    }
    .rbc-event-content-responsive,
    .rbc-event-content-responsive span:not(.recurring-indicator) {
      font-size: 10px !important;
      font-weight: 500 !important;
    }
    .rbc-event-content-responsive .recurring-indicator {
      font-size: 8px !important;
      margin-left: 2px !important;
      font-weight: 600 !important;
    }
    .rbc-month-view .rbc-day-bg {
      min-height: 50px !important;
    }
    .rbc-month-row {
      min-height: 50px !important;
    }
    .rbc-date-cell {
      padding: 2px 4px !important;
      font-size: 11px !important;
    }
    .rbc-header {
      padding: 8px 4px !important;
      font-size: 11px !important;
    }
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
  .rbc-day-bg {
    position: relative !important;
  }
  .rbc-month-view .rbc-day-bg {
    position: relative !important;
  }
  .rbc-month-view .rbc-day-bg.has-daily-total {
    overflow: visible !important;
  }
  @media (min-width: 640px) {
    .rbc-month-view .rbc-day-bg.has-daily-total {
      display: flex !important;
      flex-direction: column !important;
    }
    .rbc-month-view .rbc-day-bg.has-daily-total .rbc-events-container {
      flex: 1 1 auto !important;
      overflow: visible !important;
    }
  }
  @media (max-width: 639px) {
    .rbc-month-view .rbc-day-bg.has-daily-total {
      min-height: auto !important;
      padding-bottom: 0 !important;
      display: block !important;
    }
  }
  .rbc-month-view .rbc-row-content {
    overflow: visible !important;
  }
  .rbc-month-row {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-day-slot {
    position: relative !important;
  }
  .rbc-month-view .rbc-events-container {
    position: relative !important;
  }
  .daily-job-total {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    letter-spacing: 0.01em !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: none !important;
    white-space: nowrap !important;
  }
  /* Mobile styles - top left position */
  @media (max-width: 639px) {
    .daily-job-total {
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      z-index: 999 !important;
      max-width: calc(100% - 4px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 7px !important;
      font-weight: 700 !important;
      color: #111827 !important;
      padding: 2px 4px !important;
      margin: 0 !important;
      text-align: left !important;
    }
    .rbc-month-view .rbc-day-bg.has-daily-total {
      position: relative !important;
      overflow: visible !important;
    }
    .rbc-month-view .rbc-date-cell {
      z-index: 1 !important;
      position: relative !important;
    }
  }
  /* Desktop styles - top left position */
  @media (min-width: 640px) {
    .daily-job-total {
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      z-index: 999 !important;
      max-width: calc(100% - 4px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      color: #111827 !important;
      padding: 2px 4px !important;
      margin: 0 !important;
      text-align: left !important;
    }
    .rbc-month-view .rbc-day-bg.has-daily-total {
      position: relative !important;
      overflow: visible !important;
    }
    .rbc-month-view .rbc-date-cell {
      z-index: 1 !important;
      position: relative !important;
    }
  }
  .rbc-month-view .rbc-day-bg.has-daily-total .rbc-events-container {
    margin-bottom: 0 !important;
  }
  .rbc-month-view .rbc-events-container {
    padding: 2px 1px !important;
    position: relative !important;image.png
  }
  .rbc-month-view .rbc-day-bg {
    padding: 2px !important;
  }
  .rbc-month-view .rbc-event {
    position: relative !important;
    z-index: 2 !important;
  }
`;
import { JobCard } from "../jobs/JobCard";
import { jobsApi, useGetCalendarJobsQuery, useGetAppointmentsCalendarQuery, useGetEstimateAppointmentsCalendarQuery, useGetJobDetailsQuery, useUpdateAppointmentMutation, useDeleteAppointmentMutation, useUpdateEstimateStatusMutation, useDeleteEstimateMutation } from "../../../store/api/jobsApi";
import { useSelector, useDispatch } from "react-redux";
import { EditJobDialog } from "../jobs/EditJobDialog";
import { TimelineSidebar } from "./TimelineSidebar";
import { useUpdateJobMutation } from "../../../store/api/jobsApi";
import { Typography } from "@mui/material";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

// Custom Event Component that accepts staff drops
function DroppableEvent({ event, title, style, onStaffDrop, onSelectEvent, continuesPrior, continuesAfter, ...props }) {
  // Detect mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract time from event for mobile view (like Google Calendar)
  const getDisplayTitle = () => {
    if (!isMobile) return title || event?.title || "";
    
    // On mobile, show only the time - extract from event start time
    if (event?.start) {
      const eventDate = new Date(event.start);
      const hours = eventDate.getHours();
      const minutes = eventDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      // Format: "8 AM" or "1:30 PM"
      if (minutes === 0) {
        return `${displayHours} ${ampm}`;
      } else {
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
    }
    
    // Fallback: try to extract from title if event.start is not available
    const fullTitle = title || event?.title || "";
    const timeMatch = fullTitle.match(/^(\d{1,2}(?::\d{2})?\s?(AM|PM))/i);
    if (timeMatch) {
      return timeMatch[1];
    }
    
    // Last fallback
    return fullTitle.substring(0, 6);
  };

  const displayTitle = getDisplayTitle();

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
            boxShadow: "none",
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

  // Use a ref to ensure click handler works on first render
  const eventRef = useRef(null);
  const clickHandlerRef = useRef(null);
  
  useEffect(() => {
    // Attach click handler directly to DOM element to ensure it works on first render
    const element = eventRef.current;
    if (element && onSelectEvent && event) {
      const handleClick = (e) => {
        // Handle all clicks on this element
        e.stopPropagation();
        e.preventDefault();
        console.log('Direct DOM click handler:', event.type, 'target:', e.target.className);
        if (onSelectEvent && event) {
          onSelectEvent(event);
        }
      };
      // Use capture phase to catch clicks early, before any other handlers
      element.addEventListener('mousedown', handleClick, true);
      element.addEventListener('click', handleClick, true);
      clickHandlerRef.current = handleClick;
      return () => {
        if (clickHandlerRef.current && element) {
          element.removeEventListener('mousedown', clickHandlerRef.current, true);
          element.removeEventListener('click', clickHandlerRef.current, true);
        }
      };
    }
  }, [event, onSelectEvent]);

  const eventStyle = style || {};
  const eventTitle = title || event?.title || "";
  
  // Use displayTitle (already calculated above) for rendering
  // displayTitle will show only time on mobile, full title on desktop
  
  // Check if job is recurring
  const resource = event?.resource;
  const isRecurring = resource && (
    resource.job_type === "recurring"
  );
  const isEstimate = event?.type === "estimate";
  
  // Get the background color from the event style (set by eventStyleGetter)
  // We need to extract it from the parent wrapper's computed style or pass it differently
  let backgroundColor = "#9ca3ef"; // Default
  
  if (event?.type === 'appointment') {
    const appointment = resource;
    switch (appointment?.appointment_status) {
      case "new":
        backgroundColor = "#9ca3ef"; // Light purple-blue for unconfirmed
        break;
      case "confirmed":
        backgroundColor = "#06b6d4"; // Cyan
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // Red
        break;
      case "showed":
        backgroundColor = "#10b981"; // Green
        break;
      case "noshow":
        backgroundColor = "#f59e0b"; // Orange/Yellow
        break;
      case "invalid":
        backgroundColor = "#6b7280"; // Gray
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
      ref={(node) => {
        drop(node);
        eventRef.current = node;
      }}
      className={cn(
        "rbc-event",
        isOver && "rbc-event-droppable"
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        // Call onSelectEvent directly
        if (onSelectEvent && event) {
          console.log('Event clicked in wrapper:', event.type);
          onSelectEvent(event);
        }
      }}
      style={{
        backgroundColor: backgroundColor,
        border: "none",
        outline: "none",
        borderRadius: isMobile ? "4px" : "6px",
        padding: isMobile ? "4px 6px" : "6px 10px",
        boxShadow: "none",
        margin: "0",
        cursor: "pointer",
        pointerEvents: "auto",
        position: "relative",
        zIndex: 10,
        width: "100%",
        height: "100%",
        minHeight: "20px",
        lineHeight: isMobile ? "1.2" : "1.3",
        fontWeight: "500",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: isMobile ? "center" : "space-between",
        gap: isMobile ? "2px" : "4px",
        overflow: "hidden",
        transition: "all 0.2s ease",
        border: isOver ? "2px dashed rgba(255, 255, 255, 0.8)" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      title={eventTitle}
    >
      <div 
        className="rbc-event-content-responsive"
        style={{ 
          lineHeight: isMobile ? "1.2" : "1.3",
          backgroundColor: "transparent",
          fontWeight: "500",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "center" : "space-between",
          gap: isMobile ? "2px" : "4px",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          padding: 0,
          cursor: "pointer",
          pointerEvents: "none",
          position: "relative",
          zIndex: 11,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <span className="truncate" style={{ 
          flex: isMobile ? "none" : 1, 
          minWidth: 0, 
          overflow: "hidden", 
          textOverflow: "ellipsis", 
          whiteSpace: "nowrap", 
          display: "block", 
          fontSize: isMobile ? "10px" : "13px",
          textAlign: isMobile ? "center" : "left",
          fontWeight: "500",
          width: isMobile ? "100%" : "auto",
          pointerEvents: "none",
        }}>
          {displayTitle}
        </span>
        {isRecurring && (
          <span className="recurring-indicator" style={{ 
            flexShrink: 0,
            fontWeight: "600",
            fontSize: isMobile ? "8px" : "11px",
            opacity: 0.9,
            marginLeft: isMobile ? "2px" : "4px",
            pointerEvents: "none",
          }}>
            (R)
          </span>
        )}
        {isEstimate && (
          <span className="estimate-indicator" style={{ 
            flexShrink: 0,
            fontWeight: "600",
            fontSize: isMobile ? "8px" : "11px",
            opacity: 0.9,
            marginLeft: isMobile ? "2px" : "4px",
            pointerEvents: "none",
          }}>
            (E)
          </span>
        )}
      </div>
    </div>
  );
}

export function NewCalendar({ users = [], isLoadingUsers = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [updateJob] = useUpdateJobMutation();
  const [updateAppointment, { isLoading: isUpdatingAppointment }] = useUpdateAppointmentMutation();
  const [deleteAppointment, { isLoading: isDeletingAppointment }] = useDeleteAppointmentMutation();
  const [updateEstimateStatus, { isLoading: isUpdatingEstimate }] = useUpdateEstimateStatusMutation();
  const [deleteEstimate, { isLoading: isDeletingEstimate }] = useDeleteEstimateMutation();
  const [events, setEvents] = useState([]);
  const [originalEvents, setOriginalEvents] = useState([]); // Store original events for height calculation
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthRowHeight, setMonthRowHeight] = useState(140);
  const [expandedDays, setExpandedDays] = useState(new Set()); // Track which days are expanded
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Responsive sidebar state - hidden on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Initialize categories - both jobs and appointments checked by default
  const [selectedCategories, setSelectedCategories] = useState({
    jobs: true,
    appointments: false,
    estimates: true,
  });
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [filterParams, setFilterParams] = useState({});
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null);
  const [deleteAppointmentDialogOpen, setDeleteAppointmentDialogOpen] = useState(false);
  const [deleteEstimateDialogOpen, setDeleteEstimateDialogOpen] = useState(false);
  
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
      const allUserIds = [];
      users.forEach((user) => {
        initialAssignees[user.user_id] = true; // All checked by default
        // Support both numeric IDs and UUIDs/emails
        const numId = parseInt(user.user_id);
        const userId = isNaN(numId) ? (user.user_id || user.email) : numId;
        allUserIds.push(userId);
      });
      setSelectedAssignees(initialAssignees);
      // Set filterParams to include all assignee_ids so all jobs show initially
      const assigneeIdsString = allUserIds.join(',');
      setFilterParams({ assignee_ids: assigneeIdsString, assigned_user_ids: assigneeIdsString });
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
        const userId = user.user_id || user.email;
        updatedAssignees[user.user_id] = assigneeIds.some(id => 
          id === user.user_id || id === userId || id === user.email
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
  
  // Build filter params for estimates API
  // API expects: start, end, status (comma-separated), assigned_user_ids (comma-separated), search
  const estimatesParams = {
    start,
    end,
  };
  
  // Estimate status - support comma-separated values
  if (filterParams.estimate_status && filterParams.estimate_status.trim()) {
    estimatesParams.status = filterParams.estimate_status;
  }
  
  // Assigned user IDs - convert from array format to comma-separated string
  if (filterParams.assigned_user_ids) {
    if (typeof filterParams.assigned_user_ids === 'string') {
      const cleaned = filterParams.assigned_user_ids.replace(/[\[\]]/g, '');
      if (cleaned.trim()) {
        estimatesParams.assigned_user_ids = cleaned;
      }
    } else if (Array.isArray(filterParams.assigned_user_ids) && filterParams.assigned_user_ids.length > 0) {
      estimatesParams.assigned_user_ids = filterParams.assigned_user_ids.join(',');
    }
  }
  
  // Search - prioritize estimate_search
  if (filterParams.estimate_search && filterParams.estimate_search.trim()) {
    estimatesParams.search = filterParams.estimate_search;
  } else if (filterParams.search && filterParams.search.trim()) {
    // Only use general search for estimates if no estimate_search is set
    estimatesParams.search = filterParams.search;
  }
  
  const { data: calendarJobs, isLoading, isFetching } = useGetCalendarJobsQuery(calendarJobsParams);
  const { data: appointments, isLoading: isLoadingAppointments, isFetching: isFetchingAppointments } = useGetAppointmentsCalendarQuery(appointmentsParams);
  // Only fetch estimates when the estimates category is enabled (not false)
  const { data: estimates, isLoading: isLoadingEstimates, isFetching: isFetchingEstimates } = useGetEstimateAppointmentsCalendarQuery(estimatesParams, {
    skip: selectedCategories.estimates === false
  });
  
  // New API returns array directly, not wrapped in results
  const jobs = Array.isArray(calendarJobs) ? calendarJobs : [];
  
  // Handle both array response and results-wrapped response for appointments
  const appointmentsList = Array.isArray(appointments) 
    ? appointments 
    : (appointments?.results ?? []);
  
  // Handle both array response and results-wrapped response for estimates
  const estimatesList = Array.isArray(estimates) 
    ? estimates 
    : (estimates?.results ?? []);
  
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
    const showEstimates = selectedCategories.estimates !== false;

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
            // Format time with minutes if not zero: "6 PM" or "6:30 PM"
            const timeStr = m.minute() === 0 ? m.format("h A") : m.format("h:mm A");

            return {
              id: job.job_id, // Use job_id from new API
              title: `${timeStr} ${job.customer_name || "Customer"}`,
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
            // Format time with minutes if not zero: "6 PM" or "6:30 PM"
            const timeStr = startM.minute() === 0 ? startM.format("h A") : startM.format("h:mm A");

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

    // Transform estimates to events (only if estimates category is enabled)
    const estimateEvents = showEstimates
      ? estimatesList
          .filter((estimate) => {
            if (!estimate.start_time) return false;
            return true;
          })
          .map((estimate) => {
            // Parse as UTC and convert to America/Chicago timezone for display
            const startM = moment.utc(estimate.start_time).tz("America/Chicago");
            const endM = moment.utc(estimate.end_time).tz("America/Chicago");
            const startDate = new Date(startM.year(), startM.month(), startM.date(), startM.hour(), startM.minute(), startM.second());
            const endDate = new Date(endM.year(), endM.month(), endM.date(), endM.hour(), endM.minute(), endM.second());
            // Format time with minutes if not zero: "6 PM" or "6:30 PM"
            const timeStr = startM.minute() === 0 ? startM.format("h A") : startM.format("h:mm A");

            return {
              id: estimate.appointment_id,
              title: `${timeStr} ${estimate.title || estimate.contact_name || "Estimate"}`,
              start: startDate,
              end: endDate,
              resource: estimate,
              type: 'estimate',
            };
          })
      : [];

    // Merge all events
    const allEvents = [...jobEvents, ...appointmentEvents, ...estimateEvents];
    
    // Store original events for height calculation
    setOriginalEvents(allEvents);
    
    // Show all events - no limiting, height will adjust dynamically
    setEvents(allEvents);
  }, [jobs, appointmentsList, estimatesList, accountTimezone, selectedCategories]);

  // Format price as currency (memoized to avoid dependency issues)
  const formatPrice = useMemo(() => {
    return (price) => {
      if (!price || isNaN(price)) return "$0.00";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    };
  }, []);

  // Check if jobs category is enabled (used for totals display)
  const showJobs = selectedCategories.jobs !== false;
  
  // Calculate daily totals for jobs (only jobs, not appointments or estimates)
  // Only calculate if jobs category is enabled
  const dailyTotals = useMemo(() => {
    // If jobs are not selected, return empty totals
    if (!showJobs) return {};
    
    const totals = {};
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Only count jobs that are scheduled
    jobs.forEach((job) => {
      if (!job.scheduled_at) return;
      if (job.total_price === null || job.total_price === undefined) return;
      
      const m = moment.utc(job.scheduled_at);
      const jobDate = new Date(m.year(), m.month(), m.date());
      
      // Only include jobs in the current month view
      if (jobDate >= monthStart && jobDate <= monthEnd) {
        const year = jobDate.getFullYear();
        const month = String(jobDate.getMonth() + 1).padStart(2, '0');
        const date = String(jobDate.getDate()).padStart(2, '0');
        const dayKey = `${year}-${month}-${date}`;
        
        const price = parseFloat(job.total_price) || 0;
        totals[dayKey] = (totals[dayKey] || 0) + price;
      }
    });

    return totals;
  }, [jobs, currentDate, showJobs]);

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
    const dailyTotalHeight = 28; // Height needed for daily total display
    
    // Check if any day has totals (need extra space)
    const hasAnyTotals = Object.keys(dailyTotals).length > 0;
    const extraHeightForTotal = hasAnyTotals ? dailyTotalHeight : 0;
    
    // Use the maximum event count to calculate height - show all events
    // Add extra height for daily total to ensure events are fully visible
    const calculatedHeight = baseHeight + (Math.max(maxCount, 1) * eventHeight) + extraHeightForTotal;
    
    // Set minimum height, but always use calculated height if it's larger
    const minHeight = hasAnyTotals ? 170 : 140; // Increased minimum when totals are present
    setMonthRowHeight(Math.max(minHeight, calculatedHeight));
  }, [originalEvents, view, currentDate, dailyTotals]);

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

  // Calculate monthly total for jobs
  const monthlyTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, dayTotal) => sum + dayTotal, 0);
  }, [dailyTotals]);

  // Inject daily totals into day cells using useEffect
  useEffect(() => {
    if (view !== "month") {
      // Clean up when not in month view
      const existingTotals = document.querySelectorAll('.daily-job-total');
      existingTotals.forEach(el => el.remove());
      return;
    }

    // Function to inject totals
    const injectTotals = () => {
      // Remove any existing daily total elements
      const existingTotals = document.querySelectorAll('.daily-job-total');
      existingTotals.forEach(el => el.remove());

      // Find all month rows
      const monthRows = document.querySelectorAll('.rbc-month-row');
      
      if (monthRows.length === 0) {
        return; // Calendar not ready yet
      }
      
      monthRows.forEach((row) => {
        // Get all date cells in this row - these contain the actual date numbers
        const dateCells = row.querySelectorAll('.rbc-date-cell');
        // Get all day-bg cells in this row - these are the day containers
        const dayBgCells = row.querySelectorAll('.rbc-day-bg');
        
        // Match date cells with day-bg cells by their column index
        dateCells.forEach((dateCell, index) => {
          // Get the date number from the date cell text
          const dateText = dateCell.textContent?.trim();
          if (!dateText) return;
          
          const dayNum = parseInt(dateText);
          if (isNaN(dayNum)) return;
          
          // Find the corresponding day-bg cell at the same index
          const dayBgCell = dayBgCells[index];
          if (!dayBgCell) return;
          
          // Determine the actual date by checking which week row we're in
          // Get the first day of the month to determine the starting day of week
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const firstDayOfWeek = firstDayOfMonth.getDay();
          
          // Find which week row this is (0-based)
          const allMonthRows = document.querySelectorAll('.rbc-month-row');
          const rowIndex = Array.from(allMonthRows).indexOf(row);
          if (rowIndex === -1) return;
          
          // Calculate the actual date: days from start of calendar grid
          const daysFromStart = rowIndex * 7 + index - firstDayOfWeek;
          const actualDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 + daysFromStart);
          
          // Verify this date is actually in the current month (not from previous/next month)
          if (actualDate.getMonth() !== currentDate.getMonth()) return;
          
          // Create date key using the actual date
          const year = actualDate.getFullYear();
          const month = String(actualDate.getMonth() + 1).padStart(2, '0');
          const date = String(actualDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${date}`;
          
          const dayTotal = dailyTotals[dateKey] || 0;
          
          // Check if there are any job events visible for this day
          const hasJobEvents = events.some(event => {
            if (event.type !== 'job') return false;
            const eventDate = event.start;
            const eventYear = eventDate.getFullYear();
            const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0');
            const eventDateNum = String(eventDate.getDate()).padStart(2, '0');
            const eventDateKey = `${eventYear}-${eventMonth}-${eventDateNum}`;
            return eventDateKey === dateKey;
          });

          // Only show total if: jobs are selected, there's a total, AND there are job events visible
          if (showJobs && dayTotal > 0 && hasJobEvents) {
            // Check if total already exists to avoid duplicates
            if (dayBgCell.querySelector('.daily-job-total')) return;
            
            // Create and insert the total element with professional styling
            const totalEl = document.createElement('div');
            totalEl.className = 'daily-job-total';
            
            // Single line format for all devices - CSS will handle positioning
            totalEl.textContent = `Total: ${formatPrice(dayTotal)}`;
            
            // Base styles that apply to all devices
            totalEl.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: none !important;
              white-space: nowrap !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            `;
            
            // Add class to identify cells with totals for CSS targeting
            dayBgCell.classList.add('has-daily-total');
            dayBgCell.style.position = 'relative';
            
            // Find the events container
            const eventsContainer = dayBgCell.querySelector('.rbc-events-container');
            
            // For desktop: Insert after events container in normal flow
            // For mobile: CSS will position it absolutely at top left
            if (eventsContainer) {
              // Insert the total right after the events container
              eventsContainer.parentNode.insertBefore(totalEl, eventsContainer.nextSibling);
            } else {
              // Fallback: append to day-bg cell
              dayBgCell.appendChild(totalEl);
            }
          }
        });
      });
    };

    // Try with a delay to ensure calendar is rendered, then retry if needed
    const timeoutId1 = setTimeout(() => {
      injectTotals();
    }, 150);

    // Retry after a longer delay in case calendar wasn't ready
    const timeoutId2 = setTimeout(() => {
      injectTotals();
    }, 400);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [view, dailyTotals, currentDate, formatPrice, events.length, showJobs]);

  const handleSelectEvent = (event) => {
    console.log('handleSelectEvent called:', event?.type, event?.resource?.job_id || event?.resource?.appointment_id);
    
    if (!event) {
      console.error('handleSelectEvent: event is null/undefined');
      return;
    }
    
    if (event.type === 'appointment') {
      setSelectedAppointment(event.resource);
      setSelectedJob(null);
      setSelectedJobId(null);
      setSelectedEstimate(null);
    } else if (event.type === 'estimate') {
      setSelectedEstimate(event.resource);
      setSelectedJob(null);
      setSelectedJobId(null);
      setSelectedAppointment(null);
    } else {
      // For jobs, fetch full job details using job_id
      const jobId = event.resource?.job_id || event.resource?.id;
      console.log('Job event clicked, jobId:', jobId);
      if (jobId) {
        // Clear previous job data immediately when selecting a new job
        setSelectedJob(null);
        setSelectedJobId(jobId);
        setSelectedAppointment(null);
        setSelectedEstimate(null);
      } else {
        console.error('handleSelectEvent: jobId is missing', event);
      }
    }
  };
  
  // Clear selectedJob when selectedJobId changes (new job selected)
  useEffect(() => {
    if (selectedJobId) {
      // Clear previous job data when a new job ID is set
      setSelectedJob(null);
    }
  }, [selectedJobId]);
  
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
          backgroundColor = "#9ca3ef"; // Light purple-blue for unconfirmed
          break;
        case "confirmed":
          backgroundColor = "#06b6d4"; // Cyan
          break;
        case "cancelled":
          backgroundColor = "#ef4444"; // Red
          break;
        case "showed":
          backgroundColor = "#10b981"; // Green
          break;
        case "noshow":
          backgroundColor = "#f59e0b"; // Orange/Yellow
          break;
        case "invalid":
          backgroundColor = "#6b7280"; // Gray
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
    // Close the parent Job Details dialog first
    setSelectedJob(null);
    setSelectedJobId(null);
    // Small delay to ensure parent dialog closes before opening edit dialog
    setTimeout(() => {
      setEditDialogOpen(true);
    }, 100);
  }

  const handleDeleteJob = (jobToDelete, option) => {
    if (!jobToDelete) return
    
    // Get job ID - support both job_id and id fields
    const jobId = jobToDelete.job_id || jobToDelete.id
    if (!jobId) {
      return
    }
    
    // Update the calendar jobs cache to remove the deleted job
    dispatch(
      jobsApi.util.updateQueryData(
        "getCalendarJobs",
        calendarJobsParams,
        (draft) => {
          if (Array.isArray(draft)) {
            if (option === "sequence" && jobToDelete.is_recurring) {
              // Remove all jobs in the recurring sequence
              const filtered = draft.filter(
                (j) => !(
                  (j.customer_name === jobToDelete.customer_name && 
                   j.job_type === jobToDelete.job_type && 
                   j.is_recurring) ||
                  j.series_id === jobToDelete.series_id
                )
              )
              // Clear and repopulate the array
              draft.length = 0
              draft.push(...filtered)
            } else {
              // Remove only the single job
              const index = draft.findIndex(j => 
                j.job_id === jobId || j.id === jobId ||
                j.job_id === jobToDelete.job_id || j.id === jobToDelete.job_id
              )
              if (index !== -1) {
                draft.splice(index, 1)
              }
            }
          }
        }
      )
    )
    
    // Close the job details dialog if the deleted job was selected
    if (selectedJob && (selectedJob.id === jobId || selectedJob.job_id === jobId)) {
      setSelectedJob(null)
      setSelectedJobId(null)
    }
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
    
    // Update the selected job with the new data and ensure modal is shown
    const jobId = result.id || result.job_id;
    if (jobId) {
      // Always set both selectedJobId and selectedJob to ensure modal opens
      setSelectedJobId(jobId);
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
    // The start Date object represents UTC time components as local time (see event creation at line 807)
    // So we extract the components and treat them as UTC directly
    const startDate = new Date(start);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const date = startDate.getDate();
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    const seconds = startDate.getSeconds();
    
    // Create moment in UTC with the extracted components (treating them as UTC, not local)
    const utcMoment = moment.utc([year, month, date, hours, minutes, seconds]);
    const newScheduledAt = utcMoment.toISOString();

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
        // Set initial time from the drop position (convert UTC to account timezone for display)
        const accountMoment = utcMoment.tz(accountTimezone);
        const hours = accountMoment.hour();
        const hour12 = hours % 12 || 12;
        setSelectedTime({
          hour: hour12.toString(),
          minute: accountMoment.format("mm"),
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
      // Error handled by toast notification
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
      // Error handled by toast notification
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
      // Error handled by toast notification
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
      // Error handled by toast notification
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
      // Error handled by toast notification
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
      // Error handled by toast notification
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

  // Handle select/deselect all team members at once
  const handleSelectAllTeamMembers = (checked) => {
    const updatedAssignees = {};
    users.forEach((user) => {
      updatedAssignees[user.user_id] = checked;
    });
    setSelectedAssignees(updatedAssignees);
    
    // Convert selectedAssignees to assignee_ids - API expects comma-separated string
    const selectedIds = checked
      ? users.map((user) => {
          // Support both numeric IDs and UUIDs/emails
          const numId = parseInt(user.user_id);
          return isNaN(numId) ? (user.user_id || user.email) : numId;
        })
      : [];
    
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

  const { toast } = useToast();

  // Handle appointment status update
  const handleAppointmentStatusChange = async (newStatus) => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) {
      toast({
        title: "Error",
        description: "Appointment information is missing",
        variant: "destructive",
      });
      return;
    }

    // Don't proceed if status hasn't actually changed
    if (newStatus === selectedAppointment.appointment_status) {
      // Still update the local state to reflect the selection (UI feedback)
      setSelectedAppointment({
        ...selectedAppointment,
        appointment_status: newStatus,
      });
      return;
    }
    
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

      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle appointment deletion
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment || !selectedAppointment.appointment_id) {
      toast({
        title: "Error",
        description: "Appointment information is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteAppointment(selectedAppointment.appointment_id).unwrap();
      
      // Remove the appointment from the calendar cache
      dispatch(
        jobsApi.util.updateQueryData(
          "getAppointmentsCalendar",
          appointmentsParams,
          (draft) => {
            if (Array.isArray(draft)) {
              const filtered = draft.filter(
                a => a.appointment_id !== selectedAppointment.appointment_id
              );
              draft.length = 0;
              draft.push(...filtered);
            } else if (draft?.results) {
              draft.results = draft.results.filter(
                a => a.appointment_id !== selectedAppointment.appointment_id
              );
            }
          }
        )
      );

      // Close dialogs
      setDeleteAppointmentDialogOpen(false);
      setSelectedAppointment(null);

      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle estimate status update
  const handleEstimateStatusChange = async (newStatus) => {
    if (!selectedEstimate || !selectedEstimate.appointment_id) {
      toast({
        title: "Error",
        description: "Estimate information is missing",
        variant: "destructive",
      });
      return;
    }

    // Get current status: use estimate_status if not null, otherwise fall back to appointment_status
    const currentStatus = selectedEstimate.estimate_status ?? selectedEstimate.appointment_status;

    // Don't proceed if status hasn't actually changed
    if (newStatus === currentStatus) {
      // Still update the local state to reflect the selection (UI feedback)
      setSelectedEstimate({
        ...selectedEstimate,
        estimate_status: newStatus,
      });
      return;
    }
    
    try {
      const result = await updateEstimateStatus({
        id: selectedEstimate.appointment_id,
        estimate_status: newStatus,
      }).unwrap();
      
      // Update the local state with the new status
      setSelectedEstimate({
        ...selectedEstimate,
        estimate_status: newStatus,
      });
      
      // Manually update the estimates cache for immediate calendar update
      dispatch(
        jobsApi.util.updateQueryData(
          "getEstimateAppointmentsCalendar",
          estimatesParams,
          (draft) => {
            if (Array.isArray(draft)) {
              const index = draft.findIndex(e => e.appointment_id === selectedEstimate.appointment_id);
              if (index !== -1) {
                draft[index] = {
                  ...draft[index],
                  estimate_status: newStatus,
                };
              }
            } else if (draft?.results) {
              const index = draft.results.findIndex(e => e.appointment_id === selectedEstimate.appointment_id);
              if (index !== -1) {
                draft.results[index] = {
                  ...draft.results[index],
                  estimate_status: newStatus,
                };
              }
            }
          }
        )
      );

      toast({
        title: "Success",
        description: "Estimate status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update estimate status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle estimate deletion
  const handleDeleteEstimate = async () => {
    if (!selectedEstimate || !selectedEstimate.appointment_id) {
      toast({
        title: "Error",
        description: "Estimate information is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteEstimate(selectedEstimate.appointment_id).unwrap();
      
      // Remove the estimate from the calendar cache
      dispatch(
        jobsApi.util.updateQueryData(
          "getEstimateAppointmentsCalendar",
          estimatesParams,
          (draft) => {
            if (Array.isArray(draft)) {
              const filtered = draft.filter(
                e => e.appointment_id !== selectedEstimate.appointment_id
              );
              draft.length = 0;
              draft.push(...filtered);
            } else if (draft?.results) {
              draft.results = draft.results.filter(
                e => e.appointment_id !== selectedEstimate.appointment_id
              );
            }
          }
        )
      );

      // Close dialogs
      setDeleteEstimateDialogOpen(false);
      setSelectedEstimate(null);

      toast({
        title: "Success",
        description: "Estimate deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete estimate. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <style>{calendarStyles}</style>
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4 w-full overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 w-full min-w-0 relative">
          {/* Mobile Overlay - Must be before sidebar for proper z-index */}
          {showSidebar && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
              aria-hidden="true"
            />
          )}

          {/* Main Calendar */}
          <div className={cn(
            "flex-1 min-w-0 overflow-hidden w-full",
            "transition-all duration-300 ease-in-out"
          )}>
            <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Calendar
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {(userRole === "admin" || userRole === "supervisor" || userRole === "manager") && (
                    <Button
                      onClick={() => navigate("/admin/calendar/create-job")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-4"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Create Job</span>
                      <span className="sm:hidden">Job</span>
                    </Button>
                )}
                <Link 
                  to={user?.role === "worker" 
                    ? `${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/calendars/view?user_ids=${user?.ghl_user_id}` 
                    : `${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/calendars/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  >
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-4"
                    size="sm"
                    >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Create Appointment</span>
                    <span className="sm:hidden">Appt</span>
                  </Button>
                </Link>
                {/* Mobile Sidebar Toggle Button - Right side */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="flex items-center gap-2 md:hidden"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Monthly Total - Only show in month view and when jobs are selected */}
              {view === "month" && showJobs && monthlyTotal > 0 && (
                <div className="flex items-center justify-end">
                  <div className="flex items-baseline gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Booked</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(monthlyTotal)}</span>
                  </div>
                </div>
              )}
              {/* Mobile: Stack controls vertically, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={navigateToday} 
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    Today
                  </Button>
                  <div className="flex items-center border rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={navigateBack} 
                      className="rounded-r-none border-r h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="font-semibold min-w-[100px] sm:min-w-[140px] md:min-w-[180px] rounded-none text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                        >
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={navigateNext} 
                      className="rounded-l-none border-l h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <Select 
                    value={view} 
                    onValueChange={(value) => setView(value)}
                    aria-label="Select calendar view"
                  >
                    <SelectTrigger className="w-[90px] sm:w-[120px] md:w-[140px] text-xs sm:text-sm h-8 sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[1300]">
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    ? `month-${currentDate.getFullYear()}-${currentDate.getMonth()}-${monthRowHeight}-${events.length}-${selectedCategories.jobs}-${selectedCategories.appointments}-${selectedCategories.estimates}`
                    : `view-${view}-${events.length}`
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

          {/* Right Sidebar - Mobile: Full width overlay, Desktop: Sidebar */}
          {showSidebar && (
            <div className={cn(
              "flex-shrink-0",
              "md:relative md:w-auto",
              "fixed md:static inset-y-0 right-0 md:inset-auto z-50 md:z-auto",
              "bg-background md:bg-transparent",
              "overflow-y-auto md:overflow-visible",
              "w-[85vw] max-w-[320px] md:w-[300px] lg:w-[340px]",
              "shadow-lg md:shadow-none",
              "transition-all duration-300 ease-in-out"
            )}>
              {/* Mobile Close Button */}
              <div className="md:hidden flex justify-between items-center p-4 border-b sticky top-0 bg-background z-10">
                <Typography variant="h6" className="font-semibold">Filters</Typography>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="h-8 w-8"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="w-full">
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
                  onSelectAllTeamMembers={handleSelectAllTeamMembers}
                  filterParams={filterParams}
                  onFilterChange={(field, value) => {
                    setFilterParams((prev) => ({
                      ...prev,
                      [field]: value,
                    }));
                  }}
                  jobs={jobs}
                  onToggleSidebar={() => setShowSidebar(false)}
                  showSidebar={showSidebar}
                />
              </div>
            </div>
          )}

          {/* Floating Expand Button - Shows when sidebar is collapsed on desktop */}
          {!showSidebar && (
            <div className="hidden md:block fixed right-4 top-1/2 -translate-y-1/2 z-40">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSidebar(true)}
                className="rounded-full shadow-lg bg-background hover:bg-accent h-10 w-10"
                title="Show filters"
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </DndProvider>

      <Dialog open={!!selectedJob || !!selectedJobId} onOpenChange={() => {
        setSelectedJob(null);
        setSelectedJobId(null);
      }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col p-0 sm:p-6">
          <div className="flex-shrink-0 px-4 pt-6 pb-4 sm:px-0 sm:pt-0">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>View and manage job information</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-0 sm:pb-0 min-h-0 md:mb-0 mb-60">
            {(() => {
              // Check if selectedJob matches selectedJobId
              const jobMatches = selectedJob && selectedJobId && (
                selectedJob.id === selectedJobId || 
                selectedJob.job_id === selectedJobId
              );
              
              // Show loading if: API is loading OR we have a jobId but no matching job data
              if (isLoadingJobDetails || (selectedJobId && !jobMatches)) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Loading job details...</span>
                    </div>
                  </div>
                );
              }
              
              // Show job details only if we have matching job data
              if (selectedJob && jobMatches) {
                return (
                  <JobCard
                    job={selectedJob}
                    onEdit={handleEdit}
                    onDelete={handleDeleteJob}
                    onUpdate={handleJobUpdate}
                    users={users}
                    accountTimezone={accountTimezone}
                  />
                );
              }
              
              return null;
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog 
        open={!!selectedAppointment} 
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
      >
        <DialogContent 
          className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col p-0 sm:p-6"
          onInteractOutside={(e) => {
            // Prevent closing when clicking on Select dropdown
            const target = e.target;
            if (target && (target.closest('[role="listbox"]') || target.closest('[data-radix-portal]'))) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex-shrink-0 px-4 pt-6 pb-4 sm:px-0 sm:pt-0">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>View appointment information</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-0 sm:pb-0 min-h-0">
            {selectedAppointment && (
              <div className="space-y-4">
              {/* Customer Information Section - At the Top */}
              <div className="space-y-3 pb-4 border-b">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer Information
                </Label>
                <div className="space-y-2.5">
                  {selectedAppointment.contact_name && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground flex-shrink-0" />
                      {selectedAppointment.ghl_contact_id ? (
                        <a
                          href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${selectedAppointment.ghl_contact_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                        >
                          {selectedAppointment.contact_name}
                        </a>
                      ) : (
                        <span className="text-sm">{selectedAppointment.contact_name}</span>
                      )}
                    </div>
                  )}

                  {selectedAppointment.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div 
                        className="text-sm text-primary hover:text-primary/80 cursor-pointer hover:underline transition-all duration-200"
                        onClick={() =>
                          window.open(
                            `${import.meta.env.VITE_GOOGLE_MAPS_SEARCH_URL || 'https://www.google.com/maps/search/?api=1&query='}${encodeURIComponent(selectedAppointment.address)}`,
                            "_blank",
                          )
                        }
                      >
                        {selectedAppointment.address}
                      </div>
                    </div>
                  )}

                  {(selectedAppointment.contact_phone || selectedAppointment.customer_phone || selectedAppointment.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${selectedAppointment.contact_phone || selectedAppointment.customer_phone || selectedAppointment.phone}`}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                      >
                        {selectedAppointment.contact_phone || selectedAppointment.customer_phone || selectedAppointment.phone}
                      </a>
                    </div>
                  )}

                  {(selectedAppointment.contact_email || selectedAppointment.customer_email || selectedAppointment.email) && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-muted-foreground flex-shrink-0" />
                      <a
                        href={`mailto:${selectedAppointment.contact_email || selectedAppointment.customer_email || selectedAppointment.email}`}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                      >
                        {selectedAppointment.contact_email || selectedAppointment.customer_email || selectedAppointment.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Details Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Title</Label>
                  <span className="text-sm">{selectedAppointment.title || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Assigned To</Label>
                  <span className="text-sm">{selectedAppointment.assigned_user_name || "Unassigned"}</span>
                </div>

                {selectedAppointment.calendar && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Calendar</Label>
                    <a
                      href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/calendars/view?user_ids=${user?.ghl_user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 decoration-primary/30 hover:decoration-primary/60 transition-all duration-200 flex items-center gap-1.5 font-medium"
                    >
                      {selectedAppointment.calendar.name || "View Calendar"}
                      <svg 
                        className="h-3.5 w-3.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                        />
                      </svg>
                    </a>
                  </div>
                )}

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
                    <SelectContent 
                      className="z-[1300] !fixed" 
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      onEscapeKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                      onPointerDownOutside={(e) => {
                        // Allow closing when clicking outside, but prevent dialog from closing
                        const target = e.target;
                        // Only prevent if clicking on the dialog overlay
                        if (target && target.hasAttribute && target.hasAttribute('data-radix-dialog-overlay')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <SelectItem value="new">Unconfirmed</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="showed">Showed</SelectItem>
                      <SelectItem value="noshow">No Show</SelectItem>
                      <SelectItem value="invalid">Invalid</SelectItem>
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
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setDeleteAppointmentDialogOpen(true)}
                  className="w-full"
                  disabled={isDeletingAppointment}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Appointment
                </Button>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Confirmation Dialog */}
      <Dialog 
        open={deleteAppointmentDialogOpen} 
        onOpenChange={(open) => {
          if (!isDeletingAppointment) {
            setDeleteAppointmentDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Appointment
            </DialogTitle>
            <DialogDescription>
              You're about to delete "{selectedAppointment?.title || 'this appointment'}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                Are you sure you want to delete "{selectedAppointment?.title || 'this appointment'}"? This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteAppointmentDialogOpen(false)} 
              disabled={isDeletingAppointment}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAppointment} 
              disabled={isDeletingAppointment}
            >
              {isDeletingAppointment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Estimate Details Dialog */}
      <Dialog 
        open={!!selectedEstimate} 
        onOpenChange={(open) => {
          if (!open) setSelectedEstimate(null);
        }}
      >
        <DialogContent 
          className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col p-0 sm:p-6"
          onInteractOutside={(e) => {
            // Prevent closing when clicking on Select dropdown
            const target = e.target;
            if (target && (target.closest('[role="listbox"]') || target.closest('[data-radix-portal]'))) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex-shrink-0 px-4 pt-6 pb-4 sm:px-0 sm:pt-0">
            <DialogHeader>
              <DialogTitle>Estimate Details</DialogTitle>
              <DialogDescription>View estimate information</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-0 sm:pb-0 min-h-0">
            {selectedEstimate && (
              <div className="space-y-4">
              {/* Customer Information Section - At the Top */}
              <div className="space-y-3 pb-4 border-b">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer Information
                </Label>
                <div className="space-y-2.5">
                  {selectedEstimate.contact_name && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground flex-shrink-0" />
                      {selectedEstimate.ghl_contact_id ? (
                        <a
                          href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/contacts/detail/${selectedEstimate.ghl_contact_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                        >
                          {selectedEstimate.contact_name}
                        </a>
                      ) : (
                        <span className="text-sm">{selectedEstimate.contact_name}</span>
                      )}
                    </div>
                  )}

                  {selectedEstimate.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div 
                        className="text-sm text-primary hover:text-primary/80 cursor-pointer hover:underline transition-all duration-200"
                        onClick={() =>
                          window.open(
                            `${import.meta.env.VITE_GOOGLE_MAPS_SEARCH_URL || 'https://www.google.com/maps/search/?api=1&query='}${encodeURIComponent(selectedEstimate.address)}`,
                            "_blank",
                          )
                        }
                      >
                        {selectedEstimate.address}
                      </div>
                    </div>
                  )}

                  {(selectedEstimate.contact_phone || selectedEstimate.customer_phone || selectedEstimate.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${selectedEstimate.contact_phone || selectedEstimate.customer_phone || selectedEstimate.phone}`}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                      >
                        {selectedEstimate.contact_phone || selectedEstimate.customer_phone || selectedEstimate.phone}
                      </a>
                    </div>
                  )}

                  {(selectedEstimate.contact_email || selectedEstimate.customer_email || selectedEstimate.email) && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-muted-foreground flex-shrink-0" />
                      <a
                        href={`mailto:${selectedEstimate.contact_email || selectedEstimate.customer_email || selectedEstimate.email}`}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                      >
                        {selectedEstimate.contact_email || selectedEstimate.customer_email || selectedEstimate.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimate Details Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Title</Label>
                  <span className="text-sm">{selectedEstimate.title || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Assigned To</Label>
                  <span className="text-sm">{selectedEstimate.assigned_user_name || "Unassigned"}</span>
                </div>

                {selectedEstimate.calendar && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Calendar</Label>
                    <a
                      href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || 'https://app.theservicepilot.com'}/v2/location/${import.meta.env.VITE_LOCATION_ID || 'b8qvo7VooP3JD3dIZU42'}/calendars/view?user_ids=${user?.ghl_user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 decoration-primary/30 hover:decoration-primary/60 transition-all duration-200 flex items-center gap-1.5 font-medium"
                    >
                      {selectedEstimate.calendar.name || "View Calendar"}
                      <svg 
                        className="h-3.5 w-3.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                        />
                      </svg>
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Status</Label>
                  <Select
                    value={selectedEstimate.estimate_status ?? selectedEstimate.appointment_status ?? ""}
                    onValueChange={handleEstimateStatusChange}
                    disabled={isUpdatingEstimate}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[1300] !fixed" 
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      onEscapeKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                      onPointerDownOutside={(e) => {
                        // Allow closing when clicking outside, but prevent dialog from closing
                        const target = e.target;
                        // Only prevent if clicking on the dialog overlay
                        if (target && target.hasAttribute && target.hasAttribute('data-radix-dialog-overlay')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="on_my_way">On My Way</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Start Time</Label>
                  <div className="text-sm">
                    {selectedEstimate.start_time 
                      ? moment.utc(selectedEstimate.start_time).tz("America/Chicago").format("MMMM D, YYYY h:mm A")
                      : "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">End Time</Label>
                  <div className="text-sm">
                    {selectedEstimate.end_time 
                      ? moment.utc(selectedEstimate.end_time).tz("America/Chicago").format("MMMM D, YYYY h:mm A")
                      : "N/A"}
                  </div>
                </div>
                {selectedEstimate.notes && (
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Notes</Label>
                    <div className="text-sm whitespace-pre-wrap">{selectedEstimate.notes}</div>
                  </div>
                )}
                {selectedEstimate.source && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Source</Label>
                    <span className="text-sm">{selectedEstimate.source}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Users Count</Label>
                  <span className="text-sm">{selectedEstimate.users_count || 0}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setDeleteEstimateDialogOpen(true)}
                  className="w-full"
                  disabled={isDeletingEstimate}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Estimate
                </Button>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Estimate Confirmation Dialog */}
      <Dialog 
        open={deleteEstimateDialogOpen} 
        onOpenChange={(open) => {
          if (!isDeletingEstimate) {
            setDeleteEstimateDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Estimate
            </DialogTitle>
            <DialogDescription>
              You're about to delete "{selectedEstimate?.title || 'this estimate'}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                Are you sure you want to delete "{selectedEstimate?.title || 'this estimate'}"? This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteEstimateDialogOpen(false)} 
              disabled={isDeletingEstimate}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEstimate} 
              disabled={isDeletingEstimate}
            >
              {isDeletingEstimate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
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
            // Reopen the parent Job Details dialog
            setSelectedJobId(editingJob?.id || editingJob?.job_id);
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