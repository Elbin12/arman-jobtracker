import { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { JobCard } from "../jobs/JobCard";
import { jobsApi, useGetCalendarJobsQuery } from "../../../store/api/jobsApi";
import { useSelector, useDispatch } from "react-redux";
import { FilterSidebar } from "../../../pages/admin/FilterSibdebar";
import { EditJobDialog } from "../jobs/EditJobDialog";
import { TimelineSidebar } from "./TimelineSidebar";
import { useUpdateJobMutation } from "../../../store/api/jobsApi";

const localizer = momentLocalizer(moment);

export function NewCalendar({ users = [] }) {
  const dispatch = useDispatch();
  const [updateJob] = useUpdateJobMutation();
  const [events, setEvents] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthRowHeight, setMonthRowHeight] = useState(140);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedAssignees, setSelectedAssignees] = useState({});

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null);

  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({});

  const user_profile = useSelector((state) => state.auth.user_profile)
  const accountTimezone = user_profile?.account?.timezone || "America/Chicago";

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
      start = new Date(currentDate.setHours(0, 0, 0));
      end = new Date(currentDate.setHours(23, 59, 59));
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const { start, end } = getDateRange();
  const { data: calendarJobs, isLoading, isFetching } = useGetCalendarJobsQuery({ ...filterParams, start, end });
  const jobs = calendarJobs?.results ?? [];

  useEffect(() => {
    const calendarEvents = jobs
      .filter((job) => {
        if (!job.scheduled_at) return false;
        return true;
      })
      .map((job) => {
        const m = moment.parseZone(job.scheduled_at).tz(accountTimezone, true);
        const startDate = new Date(m.year(), m.month(), m.date(), m.hour(), m.minute());
        const duration = parseFloat(job.duration_hours) || 2;
        const endDate = new Date(m.year(), m.month(), m.date(), m.hour() + duration, m.minute());
        const timeStr = m.format("h A");
        const recurringIndicator = job.job_type === "recurring" ? " (R)" : "";

        return {
          id: job.id,
          title: `${timeStr} ${job.customer_name || "Customer"}${recurringIndicator}`,
          start: startDate,
          end: endDate,
          resource: job,
        };
      });

    setEvents(calendarEvents);
  }, [jobs]);

  // Dynamically set month row height so all events fit
  useEffect(() => {
    if (view !== "month") return;

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const counts = {};
    events.forEach((ev) => {
      const d = ev.start;
      if (d >= monthStart && d <= monthEnd) {
        const key = d.toISOString().slice(0, 10);
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const maxCount = Object.values(counts).reduce((a, b) => Math.max(a, b), 0);
    const base = 44;
    const per = 26;
    setMonthRowHeight(base + Math.max(maxCount, 1) * per);
  }, [events, view, currentDate]);

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
    setSelectedJob(event.resource);
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
    const job = event.resource;
    let backgroundColor = "#3174ad";

    switch (job.status) {
      case "scheduled":
        backgroundColor = "#8b5cf6"; // Purple for scheduled (accepted quotes)
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
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "none",
        fontSize: "12px",
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
    dispatch(
      jobsApi.util.updateQueryData(
        "getCalendarJobs",
        { ...filterParams, start, end },
        (draft) => {
          const index = draft.results.findIndex(j => j.id === result.id);
          if (index !== -1) {
            draft.results[index] = result;
          } else {
            // If not found, add it (in case it's a new job)
            draft.results.push(result);
          }
        }
      )
    );
    
    // If this is the selected job, update it
    if (selectedJob && selectedJob.id === result.id) {
      setSelectedJob(result);
    }
  }

  // Handle event drop (drag and drop)
  const handleEventDrop = async ({ event, start, end }) => {
    const job = event.resource;
    if (!job) return;

    try {
      const newScheduledAt = moment(start).tz(accountTimezone).format();
      const duration = moment(end).diff(moment(start), "hours", true);
      
      const result = await updateJob({
        id: job.id,
        scheduled_at: newScheduledAt,
        duration_hours: duration,
      }).unwrap();
      
      handleJobUpdate(result);
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  // Handle event resize (drag to change duration)
  const handleEventResize = async ({ event, start, end }) => {
    const job = event.resource;
    if (!job) return;

    try {
      const newScheduledAt = moment(start).tz(accountTimezone).format();
      const duration = moment(end).diff(moment(start), "hours", true);
      
      const result = await updateJob({
        id: job.id,
        scheduled_at: newScheduledAt,
        duration_hours: duration,
      }).unwrap();
      
      handleJobUpdate(result);
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const handleCategoryToggle = (categoryId, checked) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [categoryId]: checked,
    }));
  };

  const handleAssigneeToggle = (assigneeId, checked) => {
    setSelectedAssignees((prev) => ({
      ...prev,
      [assigneeId]: checked,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {/* Left Sidebar */}
        {showSidebar && (
          <TimelineSidebar
            currentDate={currentDate}
            onDateChange={(date) => setCurrentDate(date)}
            users={users}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            selectedAssignees={selectedAssignees}
            onAssigneeToggle={handleAssigneeToggle}
          />
        )}

        {/* Main Calendar */}
        <div className="flex-1">
          <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendar
            </CardTitle>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterSidebarOpen(true)}
              >
                Manage Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Loading calendar...</span>
              </div>
            </div>
          )}
          
          <div
            className="min-h-[320px]"
            style={{
              height: view === "month" ? monthTotalHeight : "auto",
              ["--month-row-height"]: `${monthRowHeight}px`,
            }}
          >
            <BigCalendar
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
              eventPropGetter={eventStyleGetter}
              min={new Date(1970, 1, 1, 6, 0, 0)}
              max={new Date(1970, 1, 1, 23, 59, 59)}
              draggableAccessor={() => true}
              resizable={true}
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
        </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-2 sm:px-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded"></div>
          <span className="text-xs sm:text-sm">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
          <span className="text-xs sm:text-sm">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
          <span className="text-xs sm:text-sm">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
          <span className="text-xs sm:text-sm">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
          <span className="text-xs sm:text-sm">Cancelled</span>
        </div>
      </div>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>View and manage job information</DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <JobCard
              job={selectedJob}
              onEdit={handleEdit}
              onDelete={handleDeleteJob}
              users={users}
            />
          )}
        </DialogContent>
      </Dialog>
      <FilterSidebar
        open={filterSidebarOpen}
        onClose={() => setFilterSidebarOpen(false)}
        onApplyFilters={(filters) => {
          setFilterParams(filters);
          setFilterSidebarOpen(false);
        }}
        assignees={users}
        initialFilters={filterParams}
      />

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
        />
      

    </div>
  );
}