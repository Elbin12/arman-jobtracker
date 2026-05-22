import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAvailableEmployeesForDateQuery } from "../../../store/api/payrollApi";
import {
  buildAvailableEmployeesQueryParams,
  describeAvailabilityWindow,
} from "../../../utils/availableEmployeesQuery";

export function getEmployeeAssignmentUserId(employee) {
  const v = employee.user_id ?? employee.id;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

function formatJobDateLabel(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Full team list with PTO / unavailable badges for a job date (and optional time slot).
 *
 * Availability uses GET /payroll/time-off/available-employees/:
 * - date only → full-day overlap (legacy)
 * - date + job time + duration → from_time / to_time (half-day PTO can still be assignable)
 */
export function JobTeamAssignmentField({
  employees = [],
  employeesLoading,
  jobDateYmd,
  /** { hour, minute, period: 'AM'|'PM' } from job schedule */
  jobScheduleTime,
  /** Estimated job length in hours (default 2) */
  jobDurationHours = 2,
  isUserAssigned,
  onToggleUser,
}) {
  const availabilityParams = useMemo(
    () =>
      buildAvailableEmployeesQueryParams({
        date: jobDateYmd?.trim() || undefined,
        hour: jobScheduleTime?.hour,
        minute: jobScheduleTime?.minute,
        ampm: jobScheduleTime?.period,
        duration_hours: jobDurationHours,
      }),
    [
      jobDateYmd,
      jobScheduleTime?.hour,
      jobScheduleTime?.minute,
      jobScheduleTime?.period,
      jobDurationHours,
    ]
  );

  const noJobDateYet = !availabilityParams?.date;

  const { data, isFetching, isError } = useGetAvailableEmployeesForDateQuery(
    availabilityParams,
    { skip: !availabilityParams }
  );

  const windowLabel = useMemo(
    () => describeAvailabilityWindow(availabilityParams),
    [availabilityParams]
  );

  const usesTimeSlot = Boolean(
    availabilityParams?.from_time && availabilityParams?.to_time
  );

  const availableUserIds = useMemo(() => {
    const list = data?.employees ?? [];
    return new Set(list.map((e) => Number(e.id)));
  }, [data]);

  const dateParam = availabilityParams?.date;
  const availabilityResolved = Boolean(availabilityParams) && !isFetching && !isError;
  const waitingOnAvailability = Boolean(availabilityParams) && isFetching;

  const describeAvailability = (userId) => {
    const n = Number(userId);
    if (!Number.isFinite(n)) {
      return { showUnavailable: false, unknown: true };
    }
    if (!availabilityParams || isError) {
      return { showUnavailable: false, unknown: true };
    }
    if (isFetching) {
      return { showUnavailable: false, unknown: true };
    }
    const available = availableUserIds.has(n);
    return {
      showUnavailable: !available,
      unknown: false,
    };
  };

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading employees...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="space-y-3">
        {noJobDateYet ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Set the job date first.</span>{" "}
            Team assignment stays locked until a date is chosen so we can check time off
            and availability.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {waitingOnAvailability && (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking availability…
            </span>
          )}
          {dateParam && availabilityResolved && (
            <span>
              Scheduling for{" "}
              <span className="font-medium text-foreground">
                {formatJobDateLabel(dateParam)}
              </span>
              {usesTimeSlot ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-medium text-foreground">{windowLabel}</span>
                </>
              ) : null}
              . People marked unavailable cannot be assigned
              {usesTimeSlot ? " for that time" : " that day"}.
            </span>
          )}
        </div>

        {isError && dateParam ? (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-3 py-2">
            Could not load availability. Everyone is shown without PTO indicators; try
            again or continue with caution.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => {
            const userId = getEmployeeAssignmentUserId(employee);
            const assigned = isUserAssigned(userId);
            const { showUnavailable, unknown } = describeAvailability(userId);
            const unavailable = availabilityResolved && showUnavailable;

            const checkboxDisabled =
              noJobDateYet ||
              waitingOnAvailability ||
              (unavailable && !assigned);

            const showNoDateTooltip = noJobDateYet;
            const showWaitTooltip = waitingOnAvailability;
            const showUnavailableTooltip = unavailable;

            const inner = (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border border-transparent px-1 py-0.5 -mx-1",
                  unavailable && "border-amber-200/60 bg-amber-50/40",
                  noJobDateYet && "opacity-75"
                )}
              >
                <Checkbox
                  id={`employee-${employee.id}`}
                  checked={assigned}
                  disabled={checkboxDisabled}
                  onCheckedChange={(checked) =>
                    onToggleUser(userId, Boolean(checked))
                  }
                />
                <Label
                  htmlFor={`employee-${employee.id}`}
                  className={cn(
                    "flex-1 flex items-center gap-2 flex-wrap min-w-0",
                    checkboxDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      unavailable && "text-muted-foreground",
                      !unavailable && !unknown && dateParam && "text-foreground",
                      noJobDateYet && "text-muted-foreground"
                    )}
                  >
                    {employee.full_name}
                  </span>
                  {noJobDateYet ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    >
                      Set date
                    </Badge>
                  ) : null}
                  {unavailable ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-950 border border-amber-300/80 hover:bg-amber-100"
                    >
                      Unavailable
                    </Badge>
                  ) : null}
                </Label>
              </div>
            );

            if (showNoDateTooltip || showWaitTooltip || showUnavailableTooltip) {
              return (
                <Tooltip key={employee.id}>
                  <TooltipTrigger asChild>{inner}</TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-left">
                    {showNoDateTooltip ? (
                      <>
                        <p className="font-medium">Assignment locked</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Choose a job date and time above. Then you can assign team
                          members based on PTO and availability.
                        </p>
                      </>
                    ) : showWaitTooltip ? (
                      <>
                        <p className="font-medium">One moment</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Loading who is available for {formatJobDateLabel(dateParam)}
                          {usesTimeSlot ? ` (${windowLabel})` : ""}…
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">
                          {usesTimeSlot ? "Not available at job time" : "Not available this day"}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {employee.full_name} has time off that overlaps{" "}
                          {usesTimeSlot ? (
                            <>
                              the scheduled window ({windowLabel}) on{" "}
                              {formatJobDateLabel(dateParam)}
                            </>
                          ) : (
                            <>all of {formatJobDateLabel(dateParam)}</>
                          )}
                          . They cannot be newly assigned unless you change the schedule.
                        </p>
                        {assigned ? (
                          <p className="text-xs mt-2 text-foreground">
                            You can clear this person to remove them from the job.
                          </p>
                        ) : null}
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={employee.id}>{inner}</div>;
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
