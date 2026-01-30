import { useState, useEffect } from "react";
import moment from "moment-timezone";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, Briefcase, Calendar as CalendarIcon, Info, Users, Move, UserPlus, Monitor, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useDrag } from "react-dnd";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Job status options - matching jobs page filter
const JOB_STATUS_CHOICES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'service_due', label: 'Service Due' },
  { value: 'on_the_way', label: 'On The Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Appointment status options
const APPOINTMENT_STATUS_CHOICES = [
  { value: 'new', label: 'Unconfirmed' }, // Maps to 'new' in backend, displays as 'Unconfirmed' in UI
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'showed', label: 'Showed' },
  { value: 'noshow', label: 'No Show' },
  { value: 'invalid', label: 'Invalid' },
];

// Estimate status options
const ESTIMATE_STATUS_CHOICES = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'on_my_way', label: 'On My Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

// Helper function to parse comma-separated string or array to array
const parseIds = (ids) => {
  if (Array.isArray(ids)) {
    return ids;
  }
  if (typeof ids === 'string') {
    const cleaned = ids.replace(/[\[\]]/g, '');
    return cleaned 
      ? cleaned.split(',').map(id => {
          const trimmed = id.trim();
          const numId = parseInt(trimmed);
          return isNaN(numId) ? trimmed : numId;
        }).filter(id => id !== '' && id !== null && id !== undefined)
      : [];
  }
  return [];
};

// Helper function to parse comma-separated status string to array
const parseStatuses = (statuses) => {
  if (Array.isArray(statuses)) {
    return statuses;
  }
  if (typeof statuses === 'string' && statuses) {
    return statuses.split(',').map(s => s.trim()).filter(s => s);
  }
  return [];
};

export function TimelineSidebar({
  currentDate,
  onDateChange,
  users = [],
  isLoadingUsers = false,
  canViewStaff = true,
  userRole = "worker", // User role for dynamic visibility rules
  selectedCategories = {},
  onCategoryToggle,
  selectedAssignees = {},
  onAssigneeToggle,
  onSelectAllTeamMembers,
  filterParams = {},
  onFilterChange,
  jobs = [], // Add jobs prop to calculate assignments
  onToggleSidebar, // Function to toggle sidebar visibility
  showSidebar = true, // Current sidebar visibility state
}) {
  const [calendarsOpen, setCalendarsOpen] = useState(true);
  const [staffOpen, setStaffOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);
  const [jobsFilterOpen, setJobsFilterOpen] = useState(true);
  const [appointmentsFilterOpen, setAppointmentsFilterOpen] = useState(true);
  const [estimatesFilterOpen, setEstimatesFilterOpen] = useState(true);
  const [statusLegendOpen, setStatusLegendOpen] = useState(true);
  const [jobsLegendOpen, setJobsLegendOpen] = useState(true);
  const [appointmentsLegendOpen, setAppointmentsLegendOpen] = useState(true);
  const [estimatesLegendOpen, setEstimatesLegendOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Parse filter params for local state
  const jobStatuses = parseStatuses(filterParams.job_status || filterParams.status || '');
  const appointmentStatuses = parseStatuses(filterParams.appointment_status || '');
  const estimateStatuses = parseStatuses(filterParams.estimate_status || '');
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState({
    job_search: filterParams.job_search || filterParams.search || '',
    appointment_search: filterParams.appointment_search || '',
    estimate_search: filterParams.estimate_search || '',
    job_status: jobStatuses,
    appointment_status: appointmentStatuses,
    estimate_status: estimateStatuses,
  });

  // Update local filters when filterParams change
  useEffect(() => {
    setLocalFilters({
      job_search: filterParams.job_search || filterParams.search || '',
      appointment_search: filterParams.appointment_search || '',
      estimate_search: filterParams.estimate_search || '',
      job_status: parseStatuses(filterParams.job_status || filterParams.status || ''),
      appointment_status: parseStatuses(filterParams.appointment_status || ''),
      estimate_status: parseStatuses(filterParams.estimate_status || ''),
    });
  }, [filterParams]);

  // Handle filter changes and apply immediately
  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    
    // Update filterParams through onFilterChange callback
    if (field === 'job_search') {
      onFilterChange?.('job_search', value);
      // Clear general search if job_search is set
      if (value && filterParams.search) {
        onFilterChange?.('search', '');
      }
    } else if (field === 'appointment_search') {
      onFilterChange?.('appointment_search', value);
      // Clear general search if appointment_search is set
      if (value && filterParams.search) {
        onFilterChange?.('search', '');
      }
    } else if (field === 'job_status') {
      if (Array.isArray(value) && value.length > 0) {
        onFilterChange?.('job_status', value.join(','));
        // Clear legacy status
        if (filterParams.status) {
          onFilterChange?.('status', '');
        }
      } else {
        onFilterChange?.('job_status', '');
      }
    } else if (field === 'appointment_status') {
      if (Array.isArray(value) && value.length > 0) {
        onFilterChange?.('appointment_status', value.join(','));
      } else {
        onFilterChange?.('appointment_status', '');
      }
    } else if (field === 'estimate_search') {
      onFilterChange?.('estimate_search', value);
      // Clear general search if estimate_search is set
      if (value && filterParams.search) {
        onFilterChange?.('search', '');
      }
    } else if (field === 'estimate_status') {
      if (Array.isArray(value) && value.length > 0) {
        onFilterChange?.('estimate_status', value.join(','));
      } else {
        onFilterChange?.('estimate_status', '');
      }
    }
  };

  // Calculate active filter counts
  const jobFilterCount = [
    localFilters.job_search,
    localFilters.job_status.length,
    parseIds(filterParams.assignee_ids || []).length
  ].filter(Boolean).length;

  const appointmentFilterCount = [
    localFilters.appointment_search,
    localFilters.appointment_status.length,
    parseIds(filterParams.assigned_user_ids || []).length
  ].filter(Boolean).length;

  const estimateFilterCount = [
    localFilters.estimate_search,
    localFilters.estimate_status.length,
    parseIds(filterParams.assigned_user_ids || []).length
  ].filter(Boolean).length;

  // Categories for filtering events
  const categories = [
    { id: "jobs", label: "Jobs", color: "#9ca3ef" },
    { id: "appointments", label: "Appointments", color: "#06b6d4" },
    { id: "estimates", label: "Estimates", color: "#14b8a6" }, // Teal for "Prior quoting" state
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

  // Check if all calendars are selected
  const allCalendarsSelected = categories.every(cat => selectedCategories[cat.id] !== false);
  
  // Check if all team members are selected
  const allTeamMembersSelected = users.length > 0 && users.every(user => selectedAssignees[user.user_id] === true);

  // Handle select/deselect all calendars
  const handleSelectAllCalendars = (checked) => {
    categories.forEach(cat => {
      onCategoryToggle?.(cat.id, checked);
    });
  };

  // Handle select/deselect all team members
  const handleSelectAllTeamMembers = (checked) => {
    if (onSelectAllTeamMembers) {
      onSelectAllTeamMembers(checked);
    } else {
      // Fallback to individual toggles if handler not provided
      users.forEach(user => {
        onAssigneeToggle?.(user.user_id, checked);
      });
    }
  };

  return (
    <div className="w-full border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto shadow-sm">
      {/* Header Section */}
      <div className="p-5 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Calendar</h2>
            <p className="text-xs text-gray-500">Scheduled jobs grouped by day.</p>
          </div>
          {/* Desktop Toggle Button - Only show on desktop */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="hidden md:flex h-8 w-8 flex-shrink-0 hover:bg-gray-200"
              title="Hide sidebar"
            >
              <PanelRightClose className="h-4 w-4 text-gray-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="p-5 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-900 mb-3">
          {moment(currentDate).format("MMMM YYYY")}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div key={idx} className="text-center text-gray-500 font-medium py-1.5 text-[11px]">
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
                  "text-center py-1.5 rounded-md cursor-pointer text-xs transition-colors",
                  !isCurrentMonth && "text-gray-300",
                  isToday && !isSelected && "bg-blue-50 text-blue-700 font-semibold",
                  isSelected && "bg-blue-600 text-white font-semibold shadow-sm",
                  isCurrentMonth && !isToday && !isSelected && "hover:bg-gray-100 text-gray-700"
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
        <CollapsibleTrigger className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 border-t border-gray-200 transition-colors">
          <span className="text-sm font-semibold text-gray-900">Calendars</span>
          {calendarsOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-3">
          {/* Select All Calendars */}
          <div className="flex items-center gap-2 py-2 mb-2 border-b border-gray-200">
            <Checkbox
              checked={allCalendarsSelected}
              onCheckedChange={handleSelectAllCalendars}
            />
            <Label className="text-sm text-gray-700 cursor-pointer" onClick={() => handleSelectAllCalendars(!allCalendarsSelected)}>
              {allCalendarsSelected ? "Deselect All" : "Select All"}
            </Label>
          </div>
          {/* Categories */}
          <div className="space-y-2.5">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 py-1">
                <div
                  className="w-3.5 h-3.5 rounded flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-gray-700 flex-1">{cat.label}</span>
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
          <CollapsibleTrigger className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 border-t border-gray-200 transition-colors">
            <span className="text-sm font-semibold text-gray-900">Team Members</span>
            {staffOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-3">
            {/* Select All Team Members */}
            {!isLoadingUsers && users.length > 0 && (
              <div className="flex items-center gap-2 py-2 mb-2 border-b border-gray-200">
                <Checkbox
                  checked={allTeamMembersSelected}
                  onCheckedChange={(checked) => {
                    handleSelectAllTeamMembers(checked);
                  }}
                />
                <Label className="text-sm text-gray-700 cursor-pointer" onClick={() => handleSelectAllTeamMembers(!allTeamMembersSelected)}>
                  {allTeamMembersSelected ? "Deselect All" : "Select All"}
                </Label>
              </div>
            )}
            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-1">
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
                  const colorIndex = user.user_id % colors.length;
                  const color = colors[colorIndex];
                  return (
                    <DraggableStaff 
                      key={user.user_id} 
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

      {/* Filters Section */}
      <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
        <CollapsibleTrigger className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 border-t border-gray-200 transition-colors">
          <span className="text-sm font-semibold text-gray-900">Filters</span>
          {filterOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-4 space-y-3">
          
          {/* Jobs Filter Section */}
          <Collapsible open={jobsFilterOpen} onOpenChange={setJobsFilterOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Jobs</span>
                {jobFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {jobFilterCount}
                  </Badge>
                )}
              </div>
              {jobsFilterOpen ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3 pl-5">
              {/* Job Search */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600">Search Jobs</Label>
            <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                    placeholder="Title, description, customer..."
                    value={localFilters.job_search}
                    onChange={(e) => handleFilterChange('job_search', e.target.value)}
                    className="pl-7 h-7 text-xs"
              />
            </div>
          </div>

              {/* Job Status - Multi-select */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600">Status</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-7 text-xs justify-between w-full"
                    >
                      <span>
                        {localFilters.job_status.length === 0
                          ? 'All Statuses'
                          : localFilters.job_status.length === 1
                          ? JOB_STATUS_CHOICES.find(s => s.value === localFilters.job_status[0])?.label || 'Selected'
                          : `${localFilters.job_status.length} Selected`}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
                      {JOB_STATUS_CHOICES.map((status) => (
                        <div
                          key={status.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                          onClick={() => {
                            const current = localFilters.job_status;
                            const newStatuses = current.includes(status.value)
                              ? current.filter(s => s !== status.value)
                              : [...current, status.value];
                            handleFilterChange('job_status', newStatuses);
                          }}
                        >
                          <Checkbox
                            checked={localFilters.job_status.includes(status.value)}
                            className="h-3.5 w-3.5"
                          />
                          <Label className="text-xs cursor-pointer flex-1">
                    {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {localFilters.job_status.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {localFilters.job_status.map((statusValue) => {
                      const status = JOB_STATUS_CHOICES.find(s => s.value === statusValue);
                      return status ? (
                        <Badge
                          key={statusValue}
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] cursor-pointer hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('job_status', localFilters.job_status.filter(s => s !== statusValue));
                          }}
                        >
                          {status.label} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Appointments Filter Section */}
          <Collapsible open={appointmentsFilterOpen} onOpenChange={setAppointmentsFilterOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Appointments</span>
                {appointmentFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {appointmentFilterCount}
                  </Badge>
                )}
              </div>
              {appointmentsFilterOpen ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3 pl-5">
              {/* Appointment Search */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600">Search Appointments</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Title, notes..."
                    value={localFilters.appointment_search}
                    onChange={(e) => handleFilterChange('appointment_search', e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
          </div>

              {/* Appointment Status - Multi-select */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600">Status</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-7 text-xs justify-between w-full"
                    >
                      <span>
                        {localFilters.appointment_status.length === 0
                          ? 'All Statuses'
                          : localFilters.appointment_status.length === 1
                          ? APPOINTMENT_STATUS_CHOICES.find(s => s.value === localFilters.appointment_status[0])?.label || 'Selected'
                          : `${localFilters.appointment_status.length} Selected`}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
                      {APPOINTMENT_STATUS_CHOICES.map((status) => (
                        <div
                          key={status.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                          onClick={() => {
                            const current = localFilters.appointment_status;
                            const newStatuses = current.includes(status.value)
                              ? current.filter(s => s !== status.value)
                              : [...current, status.value];
                            handleFilterChange('appointment_status', newStatuses);
                          }}
                        >
                          <Checkbox
                            checked={localFilters.appointment_status.includes(status.value)}
                            className="h-3.5 w-3.5"
                          />
                          <Label className="text-xs cursor-pointer flex-1">
                            {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {localFilters.appointment_status.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {localFilters.appointment_status.map((statusValue) => {
                      const status = APPOINTMENT_STATUS_CHOICES.find(s => s.value === statusValue);
                      return status ? (
                        <Badge
                          key={statusValue}
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] cursor-pointer hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('appointment_status', localFilters.appointment_status.filter(s => s !== statusValue));
                          }}
                        >
                          {status.label} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
          </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Estimates Filter Section */}
          <Collapsible open={estimatesFilterOpen} onOpenChange={setEstimatesFilterOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Estimates</span>
                {estimateFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {estimateFilterCount}
                  </Badge>
                )}
              </div>
              {estimatesFilterOpen ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3 pl-5">
              {/* Estimate Search */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600">Search Estimates</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Title, notes..."
                    value={localFilters.estimate_search}
                    onChange={(e) => handleFilterChange('estimate_search', e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
          </div>

              {/* Estimate Status - Multi-select */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600">Status</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-7 text-xs justify-between w-full"
                    >
                      <span>
                        {localFilters.estimate_status.length === 0
                          ? 'All Statuses'
                          : localFilters.estimate_status.length === 1
                          ? ESTIMATE_STATUS_CHOICES.find(s => s.value === localFilters.estimate_status[0])?.label || 'Selected'
                          : `${localFilters.estimate_status.length} Selected`}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
                      {ESTIMATE_STATUS_CHOICES.map((status) => (
                        <div
                          key={status.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                          onClick={() => {
                            const current = localFilters.estimate_status;
                            const newStatuses = current.includes(status.value)
                              ? current.filter(s => s !== status.value)
                              : [...current, status.value];
                            handleFilterChange('estimate_status', newStatuses);
                          }}
                        >
                          <Checkbox
                            checked={localFilters.estimate_status.includes(status.value)}
                            className="h-3.5 w-3.5"
                          />
                          <Label className="text-xs cursor-pointer flex-1">
                            {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {localFilters.estimate_status.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {localFilters.estimate_status.map((statusValue) => {
                      const status = ESTIMATE_STATUS_CHOICES.find(s => s.value === statusValue);
                      return status ? (
                        <Badge
                          key={statusValue}
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] cursor-pointer hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('estimate_status', localFilters.estimate_status.filter(s => s !== statusValue));
                          }}
                        >
                          {status.label} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
          </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Clear All Filters Button */}
          {(jobFilterCount > 0 || appointmentFilterCount > 0 || estimateFilterCount > 0) && (
            <button
              onClick={() => {
                handleFilterChange('job_search', '');
                handleFilterChange('appointment_search', '');
                handleFilterChange('estimate_search', '');
                handleFilterChange('job_status', []);
                handleFilterChange('appointment_status', []);
                handleFilterChange('estimate_status', []);
                // Clear assignee filters
                onFilterChange?.('assignee_ids', '');
                onFilterChange?.('assigned_user_ids', '');
              }}
              className="w-full text-xs text-gray-600 hover:text-gray-900 underline py-1.5 mt-2"
            >
              Clear All Filters
            </button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Status Legend - Read-only */}
      <Collapsible open={statusLegendOpen} onOpenChange={setStatusLegendOpen}>
        <CollapsibleTrigger className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 border-t border-gray-200 transition-colors">
          <span className="text-sm font-semibold text-gray-900">Status Legend</span>
          {statusLegendOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-3">
          <div className="space-y-3">
            {/* Job Statuses - Collapsible */}
            <Collapsible open={jobsLegendOpen} onOpenChange={setJobsLegendOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-1.5">
                <div className="text-xs font-semibold text-gray-700">Jobs</div>
                {jobsLegendOpen ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#fbbf24" }}></div>
                    <span className="text-xs text-gray-600">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#06b6d4" }}></div>
                    <span className="text-xs text-gray-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#a855f7" }}></div>
                    <span className="text-xs text-gray-600">Service Due</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#f97316" }}></div>
                    <span className="text-xs text-gray-600">On The Way</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#3b82f6" }}></div>
                    <span className="text-xs text-gray-600">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#10b981" }}></div>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#ef4444" }}></div>
                    <span className="text-xs text-gray-600">Cancelled</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Appointment Statuses - Collapsible */}
            <Collapsible open={appointmentsLegendOpen} onOpenChange={setAppointmentsLegendOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-1">
                <div className="text-xs font-semibold text-gray-700">Appointments</div>
                {appointmentsLegendOpen ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0 border border-white" style={{ backgroundColor: "#9ca3ef" }}></div>
                    <span className="text-xs text-gray-600">Unconfirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0 border border-white" style={{ backgroundColor: "#06b6d4" }}></div>
                    <span className="text-xs text-gray-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0 border border-white" style={{ backgroundColor: "#ef4444" }}></div>
                    <span className="text-xs text-gray-600">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0 border border-white" style={{ backgroundColor: "#10b981" }}></div>
                    <span className="text-xs text-gray-600">Showed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0 border border-white" style={{ backgroundColor: "#f59e0b" }}></div>
                    <span className="text-xs text-gray-600">No Show</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0 border border-white" style={{ backgroundColor: "#6b7280" }}></div>
                    <span className="text-xs text-gray-600">Invalid</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Estimate Statuses - Collapsible */}
            <Collapsible open={estimatesLegendOpen} onOpenChange={setEstimatesLegendOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-1">
                <div className="text-xs font-semibold text-gray-700">Estimates</div>
                {estimatesLegendOpen ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#14b8a6" }}></div>
                    <span className="text-xs text-gray-600">Prior Quoting (Confirmed/On My Way/In Progress)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#f97316" }}></div>
                    <span className="text-xs text-gray-600">Quoted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#22c55e" }}></div>
                    <span className="text-xs text-gray-600">Accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#ef4444" }}></div>
                    <span className="text-xs text-gray-600">Canceled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#6b7280" }}></div>
                    <span className="text-xs text-gray-600">Declined</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: "#9ca3af" }}></div>
                    <span className="text-xs text-gray-600">Expired</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* About Section */}
      <Collapsible open={aboutOpen} onOpenChange={setAboutOpen}>
        <CollapsibleTrigger className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 border-t border-gray-200 transition-colors">
          <span className="text-sm font-semibold text-gray-900">About</span>
          {aboutOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-3">
          <div className="space-y-4 text-xs text-gray-600">
            {/* Calendar Overview */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-700 mb-1">Calendar Overview</div>
                  <div className="text-gray-600 leading-relaxed">
                    This calendar displays Jobs and Appointments scheduled within your organization.
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Rules */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Users className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-700 mb-1">Visibility Rules</div>
                  <div className="text-gray-600 leading-relaxed">
                    {["admin", "manager", "supervisor"].includes(userRole) ? (
                      "You can view all jobs and appointments across all team members."
                    ) : (
                      "You can view only the jobs and appointments assigned to you."
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drag & Drop */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Move className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-700 mb-1">Drag & Drop</div>
                  <div className="text-gray-600 leading-relaxed">
                    Jobs can be rescheduled by dragging them to another day.
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Assignment - Only for admins */}
            {["admin", "manager", "supervisor"].includes(userRole) && (
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 mb-1">Staff Assignment</div>
                    <div className="text-gray-600 leading-relaxed">
                      Team members can be assigned to jobs directly from the calendar.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Device Note */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <Monitor className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-gray-500 leading-relaxed italic">
                    Drag & drop rescheduling and staff assignment are currently supported on desktop. Mobile support is coming soon.
                  </div>
                </div>
              </div>
            </div>
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
      return job.assignments.some(assignment => assignment.user === user.user_id);
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
    <div className="flex items-center gap-3 min-w-0 py-2 px-2 rounded-md hover:bg-gray-50/50 transition-colors">
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
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        
        {/* Name and Role */}
        <div className="flex-1 min-w-0">
          <div 
            className="text-sm font-medium text-gray-900 truncate"
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
        "px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 shadow-sm",
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
          checked={selectedAssignees[user.user_id] === true}
          onCheckedChange={(checked) =>
            onAssigneeToggle?.(user.user_id, checked)
          }
        />
      </div>
    </div>
  );
}

