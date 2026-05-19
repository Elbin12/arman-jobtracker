import { useState, useEffect, useRef, useMemo } from "react";
import moment from "moment-timezone";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { useUpdateJobMutation } from "../../../store/api/jobsApi";
import { TimelineSidebar } from "./TimelineSidebar";
import { useAccountTimezone } from "@/hooks/useAccountTimezone";

const DAY_WIDTH = 40; // Width of each day column in pixels (base, responsive)
const ROW_HEIGHT = 60; // Height of each staff row
const SIDEBAR_WIDTH = 128; // Width of staff name sidebar

export function TimelineView({
  jobs = [],
  users = [],
  currentDate,
  monthsToShow = 12,
  accountTimezone,
  onJobClick,
  onJobUpdate,
  onDateChange,
}) {
  const resolvedAccountTimezone = useAccountTimezone(accountTimezone);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [updateJob] = useUpdateJobMutation();
  const [draggedJob, setDraggedJob] = useState(null);
  const [draggedJobData, setDraggedJobData] = useState(null);
  const [resizingJob, setResizingJob] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizeStartLeft, setResizeStartLeft] = useState(0);
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dropPosition, setDropPosition] = useState(null);

  // Responsive day width - use state to handle window resize
  const [responsiveDayWidth, setResponsiveDayWidth] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : DAY_WIDTH
  );

  useEffect(() => {
    const handleResize = () => {
      setResponsiveDayWidth(window.innerWidth < 640 ? 30 : DAY_WIDTH);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate months array
  const months = useMemo(() => {
    const result = [];
    const start = moment(currentDate).startOf("month");
    for (let i = 0; i < monthsToShow; i++) {
      const month = moment(start).add(i, "months");
      const daysInMonth = month.daysInMonth();
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(moment(month).date(d));
      }
      result.push({
        month: month.format("MMMM YYYY"),
        monthMoment: month,
        days,
      });
    }
    return result;
  }, [currentDate, monthsToShow]);
  
  // Get all unique days across all months for column headers
  const allDays = useMemo(() => {
    const days = [];
    months.forEach((month) => {
      month.days.forEach((day) => {
        days.push(day);
      });
    });
    return days;
  }, [months]);

  // Calculate total width based on all days
  const totalWidth = useMemo(() => {
    return allDays.length * responsiveDayWidth;
  }, [allDays.length, responsiveDayWidth]);

  // Filter jobs based on selected categories and assignees
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Filter by assignee visibility
      if (job.assignments && job.assignments.length > 0) {
        const visible = job.assignments.some(
          (assignment) => selectedAssignees[assignment.user || assignment.user_id] !== false
        );
        if (!visible) return false;
      } else {
        if (selectedAssignees["unassigned"] === false) return false;
      }
      return true;
    });
  }, [jobs, selectedAssignees]);

  // Use filtered jobs for display
  const displayJobs = filteredJobs;

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped = {};
    displayJobs.forEach((job) => {
      if (!job.scheduled_at) return;
      // Parse as UTC to show time directly from API without conversion
      const jobMoment = moment.utc(job.scheduled_at);
      const dateKey = jobMoment.format("YYYY-MM-DD");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(job);
    });
    return grouped;
  }, [displayJobs]);

  // Get job position and width
  const getJobPosition = (job) => {
    if (!job.scheduled_at) return null;

    // Parse as UTC to show time directly from API without conversion
    const startMoment = moment.utc(job.scheduled_at);
    const duration = parseFloat(job.duration_hours) || 2;
    const endMoment = moment(startMoment).add(duration, "hours");

    let left = 0;
    let foundStart = false;
    let width = 0;

    for (const month of months) {
      for (let i = 0; i < month.days.length; i++) {
        const day = month.days[i];
        const dayStart = moment(day).startOf("day");
        const dayEnd = moment(day).endOf("day");

        if (!foundStart && startMoment.isSameOrAfter(dayStart) && startMoment.isBefore(dayEnd)) {
          // Job starts in this day
          const hoursFromDayStart = startMoment.diff(dayStart, "hours", true);
          const dayProgress = hoursFromDayStart / 24;
          left = left + i * responsiveDayWidth + dayProgress * responsiveDayWidth;
          foundStart = true;
        }

        if (foundStart) {
          if (endMoment.isBefore(dayEnd)) {
            // Job ends in this day
            const hoursFromDayStart = endMoment.diff(dayStart, "hours", true);
            const dayProgress = hoursFromDayStart / 24;
            width = width + (i * responsiveDayWidth + dayProgress * responsiveDayWidth) - (left - (foundStart ? 0 : left));
            break;
          } else if (endMoment.isSameOrAfter(dayEnd)) {
            // Job continues through this day
            width += responsiveDayWidth;
          }
        } else {
          left += responsiveDayWidth;
        }
      }
    }

    return { left: Math.max(0, left), width: Math.max(responsiveDayWidth * 0.5, width) };
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      scheduled: "#8b5cf6",
      pending: "#f59e0b",
      in_progress: "#3b82f6",
      onhold: "#8b5cf6",
      completed: "#10b981",
      cancelled: "#ef4444",
      confirmed: "#06b6d4",
      service_due: "#a855f7",
      on_the_way: "#f97316",
    };
    return colors[status] || "#3174ad";
  };

  // Track mouse position for drag calculations
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggedJobData) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        // Calculate and store drop position
        const date = getDateFromMousePosition(e.clientX);
        if (date) {
          setDropPosition(date);
        }
      }
    };

    const handleMouseUp = (e) => {
      if (draggedJobData) {
        const date = getDateFromMousePosition(e.clientX);
        if (date) {
          setDropPosition(date);
        }
      }
    };

    if (draggedJobData) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedJobData]);

  // Calculate date from mouse position
  const getDateFromMousePosition = (clientX) => {
    if (!timelineContainerRef.current) return null;
    
    const containerRect = timelineContainerRef.current.getBoundingClientRect();
    const sidebarWidth = window.innerWidth < 640 ? 100 : SIDEBAR_WIDTH; // Responsive sidebar width
    const relativeX = clientX - containerRect.left - sidebarWidth;
    
    if (relativeX < 0) return null;

    let accumulatedWidth = 0;
    for (const month of months) {
      for (let i = 0; i < month.days.length; i++) {
        if (relativeX >= accumulatedWidth && relativeX < accumulatedWidth + responsiveDayWidth) {
          const day = month.days[i];
          const progress = (relativeX - accumulatedWidth) / responsiveDayWidth;
          const hours = progress * 24;
          return moment(day).startOf("day").add(hours, "hours");
        }
        accumulatedWidth += responsiveDayWidth;
      }
    }
    return null;
  };

  // Handle drag start
  const handleDragStart = (result) => {
    const { draggableId } = result;
    const job = displayJobs.find((j) => j.id.toString() === draggableId);
    if (job) {
      setDraggedJob(job);
      setDraggedJobData({ job, startTime: Date.now() });
    }
  };

  // Handle drag end
  const handleDragEnd = async (result) => {
    const { destination, draggableId, source } = result;
    const job = draggedJobData?.job || displayJobs.find((j) => j.id.toString() === draggableId);
    
    setDraggedJob(null);
    setDraggedJobData(null);
    setDropPosition(null);

    if (!destination || !job) return;

    // Check if dropped on a different day
    if (destination.droppableId !== source.droppableId) {
      // Extract date from droppableId (format: "day-YYYY-MM-DD")
      const dateMatch = destination.droppableId.match(/day-(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const newDateStr = dateMatch[1];
        // Get the original time from the job (parse as UTC to show time directly from API)
        const originalMoment = moment.utc(job.scheduled_at);
        const hours = originalMoment.hour();
        const minutes = originalMoment.minute();
        
        // Create new datetime with same time but new date (use UTC to match API format)
        const newDate = moment.utc(`${newDateStr} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
        const newScheduledAt = newDate.format();
        await updateJobDate(job, newScheduledAt);
      }
    }
  };

  // Update job date
  const updateJobDate = async (job, newScheduledAt) => {
    try {
      const result = await updateJob({
        id: job.id,
        scheduled_at: newScheduledAt,
      }).unwrap();
      if (onJobUpdate) onJobUpdate(result);
    } catch (error) {
      // Error handled by toast notification
    }
  };

  // Update job assignment
  const updateJobAssignment = async (job, newAssignments) => {
    try {
      const result = await updateJob({
        id: job.id,
        assignments: newAssignments,
      }).unwrap();
      if (onJobUpdate) onJobUpdate(result);
    } catch (error) {
      // Error handled by toast notification
    }
  };

  // Handle resize start
  const handleResizeStart = (e, job, isLeftEdge = false) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingJob({ job, isLeftEdge });
    setResizeStartX(e.clientX);
    const pos = getJobPosition(job);
    if (pos) {
      setResizeStartWidth(pos.width);
      setResizeStartLeft(pos.left);
    }
  };

  // Handle resize move
  useEffect(() => {
    if (!resizingJob) return;

    const handleMouseMove = (e) => {
      // Visual feedback only - actual update happens on mouse up
    };

    const handleMouseUp = async (e) => {
      if (!resizingJob) return;
      
      const deltaX = e.clientX - resizeStartX;
      
      if (resizingJob.isLeftEdge) {
        // Resizing from left edge - change start time
        const hoursPerPixel = 24 / DAY_WIDTH;
        const hoursDelta = (deltaX * hoursPerPixel);
        // Parse as UTC to show time directly from API
        const currentMoment = moment.utc(resizingJob.job.scheduled_at);
        const newStartMoment = moment.utc(currentMoment).add(hoursDelta, "hours");
        const newDuration = parseFloat(resizingJob.job.duration_hours) - hoursDelta;
        
        if (newDuration > 0.5 && newStartMoment.isValid()) {
          try {
            const result = await updateJob({
              id: resizingJob.job.id,
              scheduled_at: newStartMoment.toISOString(),
              duration_hours: Math.max(0.5, newDuration),
            }).unwrap();
            if (onJobUpdate) onJobUpdate(result);
          } catch (error) {
            // Error handled by toast notification
          }
        }
      } else {
        // Resizing from right edge - change duration
        const newWidth = Math.max(responsiveDayWidth * 0.5, resizeStartWidth + deltaX);
        const hoursPerPixel = 24 / responsiveDayWidth;
        const newDuration = Math.max(0.5, (newWidth * hoursPerPixel));

        try {
          const result = await updateJob({
            id: resizingJob.job.id,
            duration_hours: newDuration,
          }).unwrap();
          if (onJobUpdate) onJobUpdate(result);
        } catch (error) {
          // Error handled by toast notification
        }
      }

      setResizingJob(null);
      setResizeStartX(0);
      setResizeStartWidth(0);
      setResizeStartLeft(0);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingJob, resizeStartX, resizeStartWidth, resolvedAccountTimezone, onJobUpdate, updateJob]);

  // Responsive sidebar width
  const responsiveSidebarWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : SIDEBAR_WIDTH;

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
    <div className="w-full h-full flex overflow-hidden bg-white">
      {/* Left Sidebar */}
      {showSidebar && (
        <TimelineSidebar
          currentDate={currentDate}
          onDateChange={onDateChange}
          users={users}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          selectedAssignees={selectedAssignees}
          onAssigneeToggle={handleAssigneeToggle}
        />
      )}

      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with all days as columns */}
        <div className="border-b bg-gray-50 sticky top-0 z-10">
          <div className="flex">
            {/* Empty space for month labels */}
            <div style={{ width: "150px", minWidth: "150px" }} className="border-r bg-gray-50" />
            {/* Days header - scrollable */}
            <div className="flex" style={{ width: totalWidth, minWidth: totalWidth }}>
              {allDays.map((day, dayIdx) => {
                const isToday = day.isSame(moment(), "day");
                return (
                  <div
                    key={dayIdx}
                    className="border-r text-center text-xs py-2 flex-shrink-0 bg-white hover:bg-gray-50"
                    style={{ width: responsiveDayWidth, minWidth: responsiveDayWidth }}
                  >
                    <div className={cn("font-medium", isToday && "text-blue-600 font-bold")}>
                      {day.format("D")}
                    </div>
                    <div className="text-gray-500 text-[10px]">{day.format("ddd")}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline body - Calendar Grid with Months as Rows */}
        <div className="flex-1 overflow-auto" ref={timelineRef}>
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="relative" ref={timelineContainerRef}>
              {/* Months as rows */}
              {months.map((month, monthIdx) => {
                return (
                  <div key={monthIdx} className="flex border-b relative" style={{ minHeight: "100px" }}>
                    {/* Month label on the left - sticky */}
                    <div 
                      className="sticky left-0 bg-white border-r px-3 py-2 font-semibold text-sm z-10 flex items-center shadow-sm"
                      style={{ width: "150px", minWidth: "150px" }}
                    >
                      {month.month}
                    </div>
                    
                    {/* Days row for this month - scrollable */}
                    <div className="flex" style={{ width: totalWidth, minWidth: totalWidth }}>
                      {allDays.map((day, dayIdx) => {
                        // Check if this day belongs to this month
                        const belongsToMonth = day.isSame(month.monthMoment, "month");
                        if (!belongsToMonth) {
                          return (
                            <div
                              key={dayIdx}
                              className="border-r bg-gray-50/30"
                              style={{
                                width: responsiveDayWidth,
                                minWidth: responsiveDayWidth,
                              }}
                            />
                          );
                        }
                        
                        const dateKey = day.format("YYYY-MM-DD");
                        const dayJobs = jobsByDate[dateKey] || [];
                        const isToday = day.isSame(moment(), "day");
                        
                        return (
                          <Droppable
                            key={dayIdx}
                            droppableId={`day-${dateKey}`}
                            direction="vertical"
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "border-r relative min-h-[100px] p-1",
                                  snapshot.isDraggingOver && "bg-blue-50",
                                  isToday && "bg-blue-50/30"
                                )}
                                style={{
                                  width: responsiveDayWidth,
                                  minWidth: responsiveDayWidth,
                                }}
                              >
                                {/* Jobs for this day */}
                                <div className="flex flex-col gap-1">
                                  {dayJobs.map((job, jobIdx) => {
                                    // Parse as UTC to show time directly from API without conversion
                                    const jobMoment = moment.utc(job.scheduled_at);
                                    const timeStr = jobMoment.format("h:mm A");
                                    
                                    // Get display name: company_name if available, otherwise customer_name or title
                                    const displayName = job?.company_name || job.customer_name || job.title;
                                    
                                    return (
                                      <Draggable
                                        key={job.id}
                                        draggableId={job.id.toString()}
                                        index={jobIdx}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => onJobClick?.(job)}
                                            className={cn(
                                              "rounded cursor-move text-xs p-1.5 text-white shadow-sm",
                                              snapshot.isDragging && "opacity-50 z-50"
                                            )}
                                            style={{
                                              backgroundColor: getStatusColor(job.status),
                                              ...provided.draggableProps.style,
                                            }}
                                            title={`${timeStr} - ${displayName}`}
                                          >
                                            <div className="font-medium truncate">
                                              {displayName}
                                            </div>
                                            <div className="text-[10px] opacity-90">
                                              {timeStr}
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}

