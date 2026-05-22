import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"
import { CalendarMonth, ChevronLeft, ChevronRight } from "@mui/icons-material"
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { useGetCalendarFreeSlotsQuery } from "../../store/api/user/quoteApi"

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const BRAND = {
  primary: "#023c8f",
  primaryLight: "#e8f0fc",
  primaryHover: "#f4f8ff",
}

const formatSlotDisplay = (isoSlot) => {
  const match = isoSlot.match(/T(\d{2}):(\d{2}):\d{2}(Z|[+-]\d{2}:\d{2})/)
  if (!match) return isoSlot

  const hour24 = Number.parseInt(match[1], 10)
  const minute = match[2]
  const hour12 = hour24 % 12 || 12
  const meridiem = hour24 >= 12 ? "PM" : "AM"

  return `${hour12.toString().padStart(2, "0")}:${minute} ${meridiem}`
}

const dayCellSx = ({ isCurrentMonth, hasSlots, isSelected, isTodayDate }) => ({
  width: 40,
  height: 40,
  border: "none",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.875rem",
  fontWeight: isSelected ? 600 : hasSlots && isCurrentMonth ? 500 : 400,
  lineHeight: 1,
  p: 0,
  cursor: hasSlots && isCurrentMonth ? "pointer" : "default",
  transition: "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
  color: !isCurrentMonth
    ? "text.disabled"
    : isSelected
      ? "#fff"
      : hasSlots
        ? "text.primary"
        : "text.disabled",
  bgcolor: isSelected ? BRAND.primary : "transparent",
  boxShadow: isTodayDate && !isSelected ? `inset 0 0 0 2px ${BRAND.primary}` : "none",
  opacity: isCurrentMonth ? 1 : 0.35,
  "&:hover": hasSlots && isCurrentMonth && !isSelected
    ? { bgcolor: BRAND.primaryHover }
    : {},
  "&:focus-visible": hasSlots && isCurrentMonth
    ? { outline: `2px solid ${BRAND.primary}`, outlineOffset: 2 }
    : {},
})

function CalendarDayButton({ day, visibleMonth, slotsByDate, selectedDay, onSelectDay }) {
  const dayKey = format(day, "yyyy-MM-dd")
  const isCurrentMonth = isSameMonth(day, visibleMonth)
  const hasSlots = (slotsByDate[dayKey]?.slots || []).length > 0
  const isSelected = selectedDay ? isSameDay(selectedDay, day) : false
  const isTodayDate = isToday(day)

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 0.25 }}>
      <Box
        component="button"
        type="button"
        disabled={!hasSlots || !isCurrentMonth}
        onClick={() => hasSlots && isCurrentMonth && onSelectDay(day)}
        aria-label={format(day, "EEEE, MMMM d, yyyy")}
        aria-pressed={isSelected}
        sx={dayCellSx({ isCurrentMonth, hasSlots, isSelected, isTodayDate })}
      >
        {format(day, "d")}
      </Box>
    </Box>
  )
}

function CalendarSkeleton() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, py: 1 }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", justifyContent: "center", py: 0.25 }}>
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      ))}
    </Box>
  )
}

const QuoteCalendarScheduler = ({ onSchedule, isSubmitting = false }) => {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState("")

  const startDate = startOfMonth(visibleMonth).getTime()
  const endDate = endOfMonth(visibleMonth).getTime()

  const { data, isFetching, isError } = useGetCalendarFreeSlotsQuery({ startDate, endDate })

  const slotsByDate = data || {}
  const currentMonthStart = startOfMonth(new Date())
  const canGoPrev = visibleMonth > currentMonthStart

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 })
    const days = []
    let current = start

    while (current <= end) {
      days.push(current)
      current = new Date(current)
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [visibleMonth])

  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : ""
  const selectedDaySlots = slotsByDate[selectedDayKey]?.slots || []

  useEffect(() => {
    setSelectedSlot("")
  }, [selectedDayKey])

  useEffect(() => {
    if (selectedDay && isSameMonth(selectedDay, visibleMonth)) return

    const firstAvailableDateKey = Object.keys(slotsByDate).find((dateKey) => {
      return Array.isArray(slotsByDate[dateKey]?.slots) && slotsByDate[dateKey].slots.length > 0
    })

    if (firstAvailableDateKey) {
      setSelectedDay(parseISO(firstAvailableDateKey))
      return
    }

    setSelectedDay(null)
  }, [slotsByDate, selectedDay, visibleMonth])

  const handleSubmit = () => {
    if (!selectedSlot || isSubmitting) return
    onSchedule(selectedSlot)
  }

  const selectedDayLabel = selectedDay
    ? format(selectedDay, "EEEE, MMMM d")
    : null

  const selectedSlotLabel = selectedSlot ? formatSlotDisplay(selectedSlot) : null

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CalendarMonth sx={{ color: BRAND.primary, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={600} lineHeight={1.3}>
              Select date & time
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose an available day, then pick a time slot
            </Typography>
          </Box>
        </Stack>
      </Box>

      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Calendar panel */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2.5, sm: 3 },
              borderRight: { md: "1px solid" },
              borderBottom: { xs: "1px solid", md: "none" },
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <IconButton
                size="small"
                aria-label="Previous month"
                disabled={!canGoPrev}
                onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: BRAND.primaryHover, borderColor: BRAND.primary },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>

              <Typography variant="subtitle1" fontWeight={600} component="h3">
                {format(visibleMonth, "MMMM yyyy")}
              </Typography>

              <IconButton
                size="small"
                aria-label="Next month"
                onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: BRAND.primaryHover, borderColor: BRAND.primary },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                mb: 0.5,
              }}
            >
              {WEEKDAY_LABELS.map((day) => (
                <Typography
                  key={day}
                  variant="caption"
                  align="center"
                  sx={{
                    display: "block",
                    py: 0.75,
                    color: "text.secondary",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {isFetching ? (
              <CalendarSkeleton />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.25,
                }}
              >
                {monthDays.map((day) => (
                  <CalendarDayButton
                    key={format(day, "yyyy-MM-dd")}
                    day={day}
                    visibleMonth={visibleMonth}
                    slotsByDate={slotsByDate}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                  />
                ))}
              </Box>
            )}

            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: BRAND.primary,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Selected
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    boxShadow: `inset 0 0 0 2px ${BRAND.primary}`,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Today
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Bold dates have availability
              </Typography>
            </Stack>
          </Box>

          {/* Time slots panel */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2.5, sm: 3 },
              minWidth: { md: 300 },
              bgcolor: "grey.50",
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              {selectedDayLabel ? selectedDayLabel : "Available times"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedDayLabel
                ? `${selectedDaySlots.length} slot${selectedDaySlots.length === 1 ? "" : "s"} available`
                : "Select a highlighted date on the calendar"}
            </Typography>

            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Unable to load free slots right now. Please refresh and try again.
              </Alert>
            )}

            {isFetching ? (
              <Stack spacing={1}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={44} />
                ))}
              </Stack>
            ) : selectedDaySlots.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  px: 2,
                  textAlign: "center",
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No times available for this date. Try another day.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
                  gap: 1,
                  maxHeight: { md: 280 },
                  overflowY: "auto",
                  pr: 0.5,
                }}
              >
                {selectedDaySlots.map((slot) => {
                  const selected = selectedSlot === slot
                  return (
                    <Box
                      key={slot}
                      component="button"
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      aria-pressed={selected}
                      sx={{
                        border: "1px solid",
                        borderColor: selected ? BRAND.primary : "divider",
                        borderRadius: 2,
                        py: 1.25,
                        px: 1.5,
                        bgcolor: selected ? BRAND.primary : "background.paper",
                        color: selected ? "#fff" : "text.primary",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: BRAND.primary,
                          bgcolor: selected ? BRAND.primary : BRAND.primaryHover,
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${BRAND.primary}`,
                          outlineOffset: 2,
                        },
                      }}
                    >
                      {formatSlotDisplay(slot)}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {selectedDayLabel && selectedSlotLabel && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Your appointment:{" "}
              <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
                {selectedDayLabel} at {selectedSlotLabel}
              </Typography>
            </Typography>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!selectedSlot || isSubmitting}
            onClick={handleSubmit}
            sx={{
              py: 1.35,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              boxShadow: "none",
              bgcolor: BRAND.primary,
              "&:hover": { bgcolor: "#022f73", boxShadow: "none" },
              "&.Mui-disabled": {
                bgcolor: "action.disabledBackground",
                color: "action.disabled",
              },
            }}
          >
            {isSubmitting ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <span>Scheduling...</span>
              </Stack>
            ) : (
              "Confirm schedule"
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default QuoteCalendarScheduler
