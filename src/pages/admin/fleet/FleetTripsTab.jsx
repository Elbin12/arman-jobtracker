import { Box, Button, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useGetFleetTripsQuery } from "../../../store/api/onestepgpsApi";
import { History, MapPin, Play, Route, X } from "lucide-react";
import { FleetSectionHeader, LoadingBlock, MetricCard, OperationsEmpty, OperationsPanel } from "./FleetPrimitives";
import { SP, formatClock, formatDateTime, formatDuration } from "./fleetUi";

export default function FleetTripsTab({ recordCount = 0 }) {
  const [selected, setSelected] = useState(null);
  const { data, isLoading } = useGetFleetTripsQuery({}, { pollingInterval: 30000 });
  const trips = data?.results || [];
  const totals = data?.totals || {};

  return (
    <Box>
      <FleetSectionHeader
        eyebrow="Route history"
        title="Trips & stops"
        description="Every drive, stop, route duration, distance, idle interval, and available OneStep field."
        count={data?.count || recordCount}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75} sx={{ mb: 2 }}>
        <MetricCard icon={Route} label="Distance" value={`${totals.distance_miles ?? 0} mi`} tone="blue" />
        <MetricCard icon={History} label="Drive time" value={formatDuration(totals.drive_seconds)} tone="green" />
        <MetricCard icon={MapPin} label="Stops" value={totals.stops ?? 0} tone="amber" />
      </Stack>

      <OperationsPanel title="Recent activity" subtitle="Latest 100 records for this subaccount" icon={History}>
        {isLoading ? (
          <LoadingBlock />
        ) : trips.length === 0 ? (
          <OperationsEmpty icon={History} label="Trip and stop records will appear after OneStep DataQueue starts sending activity events." />
        ) : (
          trips.map((trip) => {
            const stop = trip.kind === "stop";
            return (
              <Box
                key={trip.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "40px 1fr", sm: "42px minmax(0,1fr) 140px" },
                  gap: 1.5,
                  alignItems: "center",
                  px: 2.25,
                  py: 1.75,
                  borderBottom: `1px solid ${SP.line}`,
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "11px",
                    bgcolor: stop ? SP.amberSoft : SP.blueSoft,
                    color: stop ? SP.amber : SP.blue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stop ? <MapPin size={17} /> : <Route size={17} />}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: SP.ink }}>
                      {trip.device_name || trip.device_id}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: SP.soft,
                        color: SP.muted,
                        fontSize: 10,
                        fontWeight: 800,
                        px: 1,
                        py: 0.25,
                        borderRadius: 999,
                        textTransform: "uppercase",
                      }}
                    >
                      {stop ? "Stop" : "Drive"}
                    </Box>
                  </Stack>
                  <Typography sx={{ color: SP.slate, fontSize: 12, mt: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {trip.start_address || "Start location unavailable"}{" "}
                    <Box component="span" sx={{ color: SP.blue, fontWeight: 800, mx: 0.5 }}>→</Box>
                    {trip.end_address || "End location unavailable"}
                  </Typography>
                  <Typography sx={{ color: SP.muted, fontSize: 11, mt: 0.5 }}>
                    {formatDateTime(trip.started_at)}
                    {trip.ended_at ? ` – ${formatClock(trip.ended_at)}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { sm: "right" }, gridColumn: { xs: "2", sm: "auto" } }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: SP.ink }}>
                    {stop ? formatDuration(trip.duration_seconds) : `${trip.distance_miles != null ? Number(trip.distance_miles).toFixed(1) : "0.0"} mi`}
                  </Typography>
                  <Typography sx={{ color: SP.slate, fontSize: 12, mt: 0.25 }}>
                    {stop ? "Stopped" : formatDuration(trip.duration_seconds)}
                    {trip.idle_seconds ? ` · idle ${formatDuration(trip.idle_seconds)}` : ""}
                  </Typography>
                  <Button
                    onClick={() => setSelected(trip)}
                    sx={{ mt: 0.75, p: 0, minWidth: 0, color: SP.blue, fontSize: 12, fontWeight: 800, textTransform: "none" }}
                    startIcon={<Play size={12} />}
                  >
                    Replay
                  </Button>
                </Box>
              </Box>
            );
          })
        )}
      </OperationsPanel>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          {selected && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ p: 2.5, borderBottom: `1px solid ${SP.line}` }}>
                <Box>
                  <Typography sx={{ color: SP.blue, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Trip replay
                  </Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: SP.ink, mt: 0.5 }}>
                    {selected.device_name || selected.device_id}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelected(null)}><X size={18} /></IconButton>
              </Stack>
              <Box sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    height: 180,
                    borderRadius: "14px",
                    border: `1px solid ${SP.line}`,
                    bgcolor: "#e9eff1",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ position: "absolute", left: "25%", bottom: 40, width: 14, height: 14, borderRadius: "50%", bgcolor: SP.green, border: "4px solid #fff" }} />
                  <Box sx={{ position: "absolute", right: "25%", top: 40, width: 14, height: 14, borderRadius: "50%", bgcolor: SP.red, border: "4px solid #fff" }} />
                  <Box sx={{ position: "absolute", left: "48%", top: "46%", width: 34, height: 34, borderRadius: "50%", bgcolor: SP.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff" }}>
                    <Route size={15} />
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 2 }}>
                  {[
                    ["Started", formatDateTime(selected.started_at)],
                    ["Distance", `${Number(selected.distance_miles || 0).toFixed(1)} mi`],
                    ["Drive time", formatDuration(selected.duration_seconds)],
                    ["Maximum speed", selected.max_speed_mph != null ? `${Math.round(selected.max_speed_mph)} mph` : "Unavailable"],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ bgcolor: SP.soft, borderRadius: "9px", p: 1.25 }}>
                      <Typography sx={{ color: SP.muted, fontSize: 11 }}>{label}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
