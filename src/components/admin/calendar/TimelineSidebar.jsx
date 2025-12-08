import { useState } from "react";
import moment from "moment-timezone";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export function TimelineSidebar({
  currentDate,
  onDateChange,
  users = [],
  selectedCategories = {},
  onCategoryToggle,
  selectedAssignees = {},
  onAssigneeToggle,
}) {
  const [calendarsOpen, setCalendarsOpen] = useState(true);
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

          {/* Staff/Assignees */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Staff</div>
            {users.map((user) => {
              const colors = [
                "#8b5cf6",
                "#7c3aed",
                "#a78bfa",
                "#ec4899",
                "#f472b6",
                "#db2777",
              ];
              const colorIndex = user.id % colors.length;
              const color = colors[colorIndex];
              return (
                <div key={user.id} className="flex items-center gap-2 mb-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs flex-1 truncate">
                    {user.first_name} {user.last_name}
                  </span>
                  <Checkbox
                    checked={selectedAssignees[user.id] !== false}
                    onCheckedChange={(checked) =>
                      onAssigneeToggle?.(user.id, checked)
                    }
                  />
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Filter Section */}
      <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
        <CollapsibleTrigger className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 border-t">
          <span className="text-sm font-semibold">Filter</span>
          {filterOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-2">
          <div className="text-xs text-gray-600">Filter options coming soon...</div>
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

