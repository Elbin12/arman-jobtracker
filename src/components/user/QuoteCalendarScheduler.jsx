import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material"
import { AccessTime, CalendarMonth, ChevronLeft, ChevronRight } from "@mui/icons-material"
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { useGetCalendarFreeSlotsQuery } from "../../store/api/user/quoteApi"

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const formatSlotDisplay = (isoSlot) => {
  const match = isoSlot.match(/T(\d{2}):(\d{2}):\d{2}(Z|[+-]\d{2}:\d{2})/)
  if (!match) return isoSlot

  const hour24 = Number.parseInt(match[1], 10)
  const minute = match[2]
  const hour12 = hour24 % 12 || 12
  const meridiem = hour24 >= 12 ? "PM" : "AM"

  return `${hour12.toString().padStart(2, "0")}:${minute} ${meridiem}`
}

const QuoteCalendarScheduler = ({ onSchedule, isSubmitting = false }) => {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState("")

  const startDate = startOfMonth(visibleMonth).getTime()
  const endDate = endOfMonth(visibleMonth).getTime()

  const { data, isFetching, isError } = useGetCalendarFreeSlotsQuery({ startDate, endDate })

  const slotsByDate = data || {}

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

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          color: "white",
          background: "linear-gradient(90deg, #023c8f 0%, #0056d3 100%)",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonth />
          <Typography variant="h6" fontWeight={600}>
            Select Date & Time
          </Typography>
        </Stack>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button
              variant="text"
              startIcon={<ChevronLeft />}
              onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}
            >
              Prev
            </Button>
            <Typography variant="h6" fontWeight={600}>
              {format(visibleMonth, "MMMM yyyy")}
            </Typography>
            <Button
              variant="text"
              endIcon={<ChevronRight />}
              onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
            >
              Next
            </Button>
          </Box>

          <Grid container spacing={1} columns={7}>
            {WEEKDAY_LABELS.map((day) => (
              <Grid item xs={1} key={day}>
                <Typography
                  variant="caption"
                  align="center"
                  sx={{ display: "block", color: "text.secondary", fontWeight: 600 }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {isFetching ? (
            <Box minHeight={220} display="flex" alignItems="center" justifyContent="center">
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading available slots...</Typography>
            </Box>
          ) : (
            <Grid container spacing={1} columns={7}>
              {monthDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd")
                const isCurrentMonth = isSameMonth(day, visibleMonth)
                const hasSlots = (slotsByDate[dayKey]?.slots || []).length > 0
                const isSelected = selectedDay ? isSameDay(selectedDay, day) : false

                return (
                  <Grid item xs={1} key={dayKey}>
                    <Button
                      fullWidth
                      variant={isSelected ? "contained" : "outlined"}
                      onClick={() => hasSlots && isCurrentMonth && setSelectedDay(day)}
                      disabled={!hasSlots || !isCurrentMonth}
                      sx={{
                        minWidth: 0,
                        py: 1.2,
                        borderRadius: 2,
                        opacity: isCurrentMonth ? 1 : 0.35,
                        borderColor: hasSlots ? "#023c8f" : "divider",
                        color: isSelected ? "white" : hasSlots ? "#023c8f" : "text.disabled",
                        backgroundColor: isSelected ? "#023c8f" : "transparent",
                        fontWeight: hasSlots ? 700 : 500,
                      }}
                    >
                      {format(day, "d")}
                    </Button>
                  </Grid>
                )
              })}
            </Grid>
          )}

          {isError && (
            <Alert severity="error">
              Unable to load free slots right now. Please refresh and try again.
            </Alert>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#023c8f", fontWeight: 600 }}>
              Available Times
            </Typography>
            {selectedDaySlots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Select a highlighted day to view available slots.
              </Typography>
            ) : (
              <Grid container spacing={1.5}>
                {selectedDaySlots.map((slot) => {
                  const selected = selectedSlot === slot
                  return (
                    <Grid item xs={12} sm={6} md={4} key={slot}>
                      <Button
                        fullWidth
                        variant={selected ? "contained" : "outlined"}
                        onClick={() => setSelectedSlot(slot)}
                        startIcon={<AccessTime />}
                        sx={{
                          justifyContent: "flex-start",
                          borderRadius: 2,
                          py: 1.1,
                          fontWeight: 600,
                          color: selected ? "white" : "#023c8f",
                          borderColor: "#023c8f",
                          backgroundColor: selected ? "#023c8f" : "transparent",
                        }}
                      >
                        {formatSlotDisplay(slot)}
                      </Button>
                    </Grid>
                  )
                })}
              </Grid>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            disabled={!selectedSlot || isSubmitting}
            onClick={handleSubmit}
            sx={{
              py: 1.25,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(90deg, #023c8f 0%, #0056d3 100%)",
            }}
          >
            {isSubmitting ? "Scheduling..." : "Confirm Schedule"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default QuoteCalendarScheduler
