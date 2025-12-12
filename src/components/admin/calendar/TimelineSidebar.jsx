import { useState } from "react";
import moment from "moment-timezone";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useDrag } from "react-dnd";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATUS_CHOICES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'service_due', label: 'Service Due' },
  { value: 'on_the_way', label: 'On The Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const JOB_TYPE_CHOICES = [
  { value: 'one_time', label: 'One Time' },
  { value: 'recurring', label: 'Recurring' },
];

export function TimelineSidebar({
  currentDate,
  onDateChange,
  users = [],
  isLoadingUsers = false,
  canViewStaff = true,
  selectedCategories = {},
  onCategoryToggle,
  selectedAssignees = {},
  onAssigneeToggle,
  filterParams = {},
  onFilterChange,
  jobs = [], // Add jobs prop to calculate assignments
}) {
  const [calendarsOpen, setCalendarsOpen] = useState(true);
  const [staffOpen, setStaffOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Get unique job statuses/categories from jobs (we'll pass this as prop later)
  const categories = [
    { id: "clients", label: "Clients", color: "#10b981" },
    { id: "internal", label: "Internal Projects", color: "#ef4444" },
    { id: "meetings", label: "Meetings", color: "#f59e0b" },
  ];

  // Generate mini calendar days
  const monthStart = moment(currentDate).startOf("month");
  const monthEnd = moment(currentDate).endOf("month");
  const startDate = moment(monthStart).startOf("week");
  const endDate = moment(monthEnd).endOf("week");
  const days = [];
  let day = moment(startDate);
  while (day <= endDate) {
    days.push(moment(day));
    day.add(1, "day");
  }

  return (
    <div className="w-64 border-r bg-white flex flex-col h-full overflow-y-auto">
      {/* Mini Calendar */}
      <div className="p-4 border-b">
        <div className="text-sm font-semibold mb-2">
          {moment(currentDate).format("MMMM YYYY")}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div key={idx} className="text-center text-gray-500 font-medium py-1">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            const isCurrentMonth = day.month() === moment(currentDate).month();
            const isToday = day.isSame(moment(), "day");
            const isSelected = day.isSame(moment(currentDate), "day");
            return (
              <div
                key={idx}
                onClick={() => onDateChange?.(day.toDate())}
                className={cn(
                  "text-center py-1 rounded cursor-pointer text-xs",
                  !isCurrentMonth && "text-gray-300",
                  isToday && "bg-blue-100 font-semibold",
                  isSelected && "bg-blue-500 text-white",
                  isCurrentMonth && !isToday && !isSelected && "hover:bg-gray-100"
                )}
              >
                {day.format("D")}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendars Section */}
      <Collapsible open={calendarsOpen} onOpenChange={setCalendarsOpen}>
        <CollapsibleTrigger className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50">
          <span className="text-sm font-semibold">Calendars</span>
          {calendarsOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-2">
          {/* Categories */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-2">Clients</div>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs flex-1">{cat.label}</span>
                <Checkbox
                  checked={selectedCategories[cat.id] !== false}
                  onCheckedChange={(checked) =>
                    onCategoryToggle?.(cat.id, checked)
                  }
                />
              </div>
            ))}
          </div>

        </CollapsibleContent>
      </Collapsible>

      {/* Team Members Section - Only show for admin, manager, or supervisor */}
      {canViewStaff && (
        <Collapsible open={staffOpen} onOpenChange={setStaffOpen}>
          <CollapsibleTrigger className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 border-t">
            <span className="text-sm font-semibold">TEAM MEMBERS</span>
            {staffOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-2">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {isLoadingUsers ? (
                // Shimmer loader for staff
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 mb-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1" style={{ width: `${65 + (i * 5)}%` }}></div>
                        <div className="h-3 bg-gray-200 rounded" style={{ width: '40%' }}></div>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-gray-200 flex-shrink-0"></div>
                      <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0"></div>
                    </div>
                  ))}
                </>
              ) : (
                users.map((user) => {
                  const colors = [
                    "#ec4899", // pink
                    "#3b82f6", // blue
                    "#8b5cf6", // purple
                    "#06b6d4", // light blue
                    "#eab308", // yellow
                    "#10b981", // green
                    "#ec4899", // pink
                    "#a78bfa", // light purple
                  ];
                  const colorIndex = user.id % colors.length;
                  const color = colors[colorIndex];
                  return (
                    <DraggableStaff 
                      key={user.id} 
                      user={user} 
                      color={color} 
                      selectedAssignees={selectedAssignees} 
                      onAssigneeToggle={onAssigneeToggle}
                      jobs={jobs}
                    />
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Filter Section */}
      <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
        <CollapsibleTrigger className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 border-t">
          <span className="text-sm font-semibold">Filters</span>
          {filterOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {/* Search Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs, customers..."
                value={filterParams.search || ''}
                onChange={(e) => onFilterChange?.('search', e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Status</Label>
            <Select
              value={filterParams.status || 'all'}
              onValueChange={(value) => onFilterChange?.('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_CHOICES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Type Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Job Type</Label>
            <Select
              value={filterParams.job_type || 'all'}
              onValueChange={(value) => onFilterChange?.('job_type', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {JOB_TYPE_CHOICES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {(filterParams.search || filterParams.status || filterParams.job_type) && (
            <button
              onClick={() => {
                onFilterChange?.('search', '');
                onFilterChange?.('status', '');
                onFilterChange?.('job_type', '');
              }}
              className="w-full text-xs text-gray-600 hover:text-gray-900 underline py-1"
            >
              Clear Filters
            </button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* About Section */}
      <Collapsible open={aboutOpen} onOpenChange={setAboutOpen}>
        <CollapsibleTrigger className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 border-t">
          <span className="text-sm font-semibold">About</span>
          {aboutOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-2">
          <div className="text-xs text-gray-600">
            Internal Company Calendar
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Draggable Staff Component
function DraggableStaff({ user, color, selectedAssignees, onAssigneeToggle, jobs = [] }) {
  const [{ isDragging }, drag] = useDrag({
    type: "staff",
    item: { user },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Get user initials
  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  const initials = getInitials(user.first_name, user.last_name);
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  
  // Get role - default to "Technician" if not available
  const role = user.role_name || user.role || "Technician";

  // Calculate job assignments from actual jobs data
  const calculateJobStats = () => {
    if (!jobs || jobs.length === 0) {
      return { assigned: 0, total: 0 };
    }

    // Count jobs assigned to this user
    const assignedCount = jobs.filter(job => {
      if (!job.assignments || !Array.isArray(job.assignments)) return false;
      return job.assignments.some(assignment => assignment.user === user.id);
    }).length;

    const totalCount = jobs.length;
    return { assigned: assignedCount, total: totalCount };
  };

  const { assigned: assignedJobs, total: totalJobs } = calculateJobStats();
  const fraction = totalJobs > 0 ? `${assignedJobs}/${totalJobs}` : "0/0";
  
  // Determine badge color based on assignment ratio
  const getBadgeColor = (assigned, total) => {
    if (total === 0) return "bg-gray-100 text-gray-600 border-gray-200";
    const ratio = assigned / total;
    if (ratio >= 1) return "bg-pink-100 text-pink-700 border-pink-200"; // Full (pink)
    if (ratio >= 0.6) return "bg-yellow-100 text-yellow-700 border-yellow-200"; // High (yellow)
    return "bg-gray-100 text-gray-600 border-gray-200"; // Low (gray)
  };

  const badgeColorClass = getBadgeColor(assignedJobs, totalJobs);

  return (
    <div className="flex items-center gap-3 mb-3 min-w-0 py-1">
      {/* Draggable area - avatar, name, role */}
      <div
        ref={drag}
        className={cn(
          "flex items-center gap-3 flex-1 min-w-0 cursor-move",
          isDragging && "opacity-50"
        )}
      >
        {/* Circular Avatar with Initials */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        
        {/* Name and Role */}
        <div className="flex-1 min-w-0">
          <div 
            className="text-sm font-medium truncate"
            title={fullName}
          >
            {fullName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {role}
          </div>
        </div>
      </div>

      {/* Fraction Badge */}
      <div className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0",
        badgeColorClass
      )}>
        {fraction}
      </div>

      {/* Non-draggable checkbox area */}
      <div
        className="flex-shrink-0"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selectedAssignees[user.id] === true}
          onCheckedChange={(checked) =>
            onAssigneeToggle?.(user.id, checked)
          }
        />
      </div>
    </div>
  );
}

