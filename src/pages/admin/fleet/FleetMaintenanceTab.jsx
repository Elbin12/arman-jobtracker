import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { Activity, CheckCircle2, Fuel, Gauge, Plus, Siren, Wrench } from "lucide-react";
import { useGetDevicesQuery, useGetFleetMaintenanceQuery } from "../../../store/api/onestepgpsApi";
import { FleetSectionHeader, LoadingBlock, MetricCard, OperationsEmpty, OperationsPanel } from "./FleetPrimitives";
import { SP, relativeTime } from "./fleetUi";

export default function FleetMaintenanceTab({ recordCount = 0 }) {
  useGetDevicesQuery(undefined, { pollingInterval: 30000 });
  const { data, isLoading } = useGetFleetMaintenanceQuery(undefined, { pollingInterval: 30000 });
  const vehicles = data?.results || [];
  const totals = data?.totals || {};

  return (
    <Box>
      <FleetSectionHeader
        eyebrow="Vehicle health"
        title="Maintenance & diagnostics"
        description="Odometer, engine hours, fuel, service thresholds, check-engine state, and all available DTC codes."
        count={recordCount}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75} sx={{ mb: 2 }}>
        <MetricCard icon={Wrench} label="Need attention" value={totals.need_attention ?? 0} tone={totals.need_attention ? "red" : "green"} />
        <MetricCard icon={Fuel} label="Average fuel" value={totals.average_fuel != null ? `${totals.average_fuel}%` : "—"} tone="blue" />
        <MetricCard icon={Gauge} label="Vehicles monitored" value={totals.vehicles_monitored ?? 0} tone="green" />
      </Stack>

      <OperationsPanel title="Vehicle health" subtitle="Latest diagnostic state per vehicle" icon={Activity}>
        {isLoading ? (
          <LoadingBlock />
        ) : vehicles.length === 0 ? (
          <OperationsEmpty icon={Wrench} label="Diagnostic and maintenance information will appear when supported trackers send it." />
        ) : (
          <Grid container spacing={1.75} sx={{ p: 2 }}>
            {vehicles.map((v) => {
              const codes = v.dtc_codes || [];
              const needs = v.check_engine || codes.length > 0;
              return (
                <Grid item xs={12} md={6} key={v.id || v.device_id}>
                  <Box
                    sx={{
                      border: `1px solid ${needs ? "#f0c4c8" : SP.line}`,
                      boxShadow: needs ? "inset 3px 0 0 #d93a49" : "none",
                      borderRadius: "14px",
                      p: 1.75,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: "10px",
                          bgcolor: needs ? SP.redSoft : SP.greenSoft,
                          color: needs ? SP.red : SP.green,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {needs ? <Siren size={18} /> : <CheckCircle2 size={18} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{v.device_name || v.device_id}</Typography>
                        <Typography sx={{ color: SP.muted, fontSize: 11 }}>Updated {relativeTime(v.updated_at)}</Typography>
                      </Box>
                      <Box
                        sx={{
                          bgcolor: needs ? SP.redSoft : SP.greenSoft,
                          color: needs ? SP.red : "#087e36",
                          fontSize: 11,
                          fontWeight: 800,
                          px: 1,
                          py: 0.5,
                          borderRadius: 999,
                        }}
                      >
                        {needs ? "Service needed" : "Healthy"}
                      </Box>
                    </Stack>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", mt: 1.75, bgcolor: SP.line, borderRadius: "8px", overflow: "hidden" }}>
                      {[
                        ["Odometer", v.odometer_miles != null ? `${Math.round(v.odometer_miles).toLocaleString()} mi` : "Unavailable"],
                        ["Engine hours", v.engine_hours != null ? `${v.engine_hours} hr` : "Unavailable"],
                        ["Fuel", v.fuel_level_percent != null ? `${Math.round(v.fuel_level_percent)}%` : "Unavailable"],
                        ["Next service", v.next_service_miles != null ? `${Math.round(v.next_service_miles).toLocaleString()} mi` : "Not configured"],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ bgcolor: SP.soft, p: 1.25 }}>
                          <Typography sx={{ color: SP.muted, fontSize: 11 }}>{label}</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                      <Typography sx={{ color: SP.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", mr: 0.5 }}>
                        DTC codes
                      </Typography>
                      {codes.length ? (
                        codes.map((code) => (
                          <Box key={code} sx={{ bgcolor: SP.redSoft, color: SP.red, fontSize: 11, fontWeight: 800, px: 0.75, py: 0.35, borderRadius: "5px" }}>
                            {code}
                          </Box>
                        ))
                      ) : (
                        <Typography sx={{ color: SP.green, fontSize: 12 }}>None reported</Typography>
                      )}
                    </Stack>
                    <Button
                      fullWidth
                      startIcon={<Plus size={14} />}
                      sx={{
                        mt: 1.5,
                        height: 34,
                        textTransform: "none",
                        fontWeight: 800,
                        color: SP.ink,
                        border: `1px solid ${SP.line}`,
                        borderRadius: "10px",
                      }}
                    >
                      Schedule service
                    </Button>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </OperationsPanel>
    </Box>
  );
}
