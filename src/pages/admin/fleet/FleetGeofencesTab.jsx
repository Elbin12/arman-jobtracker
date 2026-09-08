import { Box, Button, Dialog, DialogContent, FormControlLabel, IconButton, Stack, Switch, TextField, Typography } from "@mui/material";
import { Hexagon, MapPin, Plus, Route, X } from "lucide-react";
import { useState } from "react";
import {
  useCreateFleetGeofenceMutation,
  useDeleteFleetGeofenceMutation,
  useGetFleetGeofencesQuery,
} from "../../../store/api/onestepgpsApi";
import { FleetSectionHeader, PrimaryButton } from "./FleetPrimitives";
import { SP } from "./fleetUi";

const ICON_TONES = [
  { bg: SP.blueSoft, fg: SP.blue },
  { bg: SP.greenSoft, fg: SP.green },
  { bg: SP.amberSoft, fg: SP.amber },
];

export default function FleetGeofencesTab({ recordCount = 0 }) {
  const { data } = useGetFleetGeofencesQuery();
  const [createGeofence] = useCreateFleetGeofenceMutation();
  const [deleteGeofence] = useDeleteFleetGeofenceMutation();
  const fences = data?.results || [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    latitude: "29.7604",
    longitude: "-95.3698",
    radius_miles: "1",
    trigger_entry: true,
    trigger_exit: true,
    after_hours: false,
  });

  const handleSave = async () => {
    await createGeofence({
      name: form.name.trim() || "New zone",
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius_miles: Number(form.radius_miles) || 1,
      trigger_entry: form.trigger_entry,
      trigger_exit: form.trigger_exit,
      after_hours: form.after_hours,
    }).unwrap();
    setOpen(false);
    setForm((prev) => ({ ...prev, name: "" }));
  };

  return (
    <Box>
      <FleetSectionHeader
        eyebrow="Location rules"
        title="Geofences"
        description="Create operating areas and trigger entry, exit, after-hours, and restricted-zone alerts."
        count={recordCount}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ bgcolor: "#fff", border: `1px solid ${SP.line}`, borderRadius: "14px", px: 2, py: 1.5, mb: 2 }}
      >
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{fences.length} active geofences</Typography>
          <Typography sx={{ color: SP.muted, fontSize: 12 }}>Showing all geofences for this subaccount.</Typography>
        </Box>
        <PrimaryButton startIcon={<Plus size={16} />} onClick={() => setOpen(true)}>
          Create geofence
        </PrimaryButton>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 360px" },
          gap: 2,
          minHeight: 480,
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: 430,
            borderRadius: "16px",
            border: `1px solid ${SP.line}`,
            overflow: "hidden",
            bgcolor: "#e8eef1",
            backgroundImage:
              "linear-gradient(35deg, transparent 46%, rgba(255,255,255,.8) 47%, rgba(255,255,255,.8) 50%, transparent 51%), linear-gradient(112deg, transparent 48%, rgba(255,255,255,.65) 49%, rgba(255,255,255,.65) 52%, transparent 53%)",
          }}
        >
          {fences.slice(0, 2).map((g, i) => (
            <Box
              key={g.id}
              sx={{
                position: "absolute",
                left: i === 0 ? "16%" : "auto",
                right: i === 1 ? "16%" : "auto",
                top: i === 0 ? 55 : 105,
                width: i === 0 ? { xs: 220, md: 320 } : 120,
                height: i === 0 ? { xs: 220, md: 320 } : 120,
                borderRadius: "50%",
                bgcolor: i === 0 ? "rgba(8,119,249,.13)" : "rgba(0,169,65,.13)",
                border: `2px solid ${i === 0 ? "rgba(8,119,249,.7)" : "rgba(0,169,65,.7)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ bgcolor: "#fff", color: i === 0 ? SP.blue : SP.green, fontSize: 12, fontWeight: 800, px: 1.25, py: 0.75, borderRadius: 999, boxShadow: SP.shadow }}>
                {g.name}
              </Box>
            </Box>
          ))}
          <Box sx={{ position: "absolute", left: "48%", top: "48%", width: 38, height: 38, borderRadius: "50%", bgcolor: SP.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff" }}>
            <Route size={16} />
          </Box>
          <Box sx={{ position: "absolute", left: 14, bottom: 14, bgcolor: "#fff", borderRadius: "9px", px: 1.25, py: 1, display: "flex", alignItems: "center", gap: 0.75, fontSize: 12, fontWeight: 800, color: SP.slate, boxShadow: SP.shadow }}>
            <MapPin size={14} color={SP.blue} /> Houston, Texas
          </Box>
        </Box>

        <Box sx={{ bgcolor: "#fff", border: `1px solid ${SP.line}`, borderRadius: "16px", overflow: "hidden" }}>
          {fences.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ color: SP.muted, fontSize: 13 }}>
                No geofences yet. Create operating areas here. Entry / exit / after-hours alerts from OneStep will also appear on the Alerts tab.
              </Typography>
            </Box>
          ) : (
            fences.map((g, i) => {
              const tone = ICON_TONES[i % ICON_TONES.length];
              const rules = [
                g.trigger_entry ? "Entry" : null,
                g.trigger_exit ? "Exit" : null,
                g.after_hours ? "After hours" : null,
              ].filter(Boolean).join(", ");
              return (
                <Box
                  key={g.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "40px minmax(0,1fr) auto",
                    gap: 1.25,
                    alignItems: "center",
                    p: 1.75,
                    borderBottom: `1px solid ${SP.line}`,
                    "&:last-child": { borderBottom: 0 },
                  }}
                >
                  <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: tone.bg, color: tone.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Hexagon size={17} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{g.name}</Typography>
                    <Typography sx={{ color: SP.muted, fontSize: 12 }}>{rules || "Active"}</Typography>
                    <Typography sx={{ color: SP.muted, fontSize: 11 }}>
                      {g.radius_miles} mi · {Number(g.latitude).toFixed(4)}, {Number(g.longitude).toFixed(4)}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => deleteGeofence(g.id)} sx={{ color: SP.muted, minWidth: 0, fontWeight: 800 }}>
                    •••
                  </Button>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ p: 2.5, borderBottom: `1px solid ${SP.line}` }}>
            <Box>
              <Typography sx={{ color: SP.blue, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Location automation
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 0.5 }}>Create geofence</Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)}><X size={18} /></IconButton>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, p: 2.5 }}>
            <Box sx={{ minHeight: 280, borderRadius: "13px", bgcolor: "#e8eef1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 190, height: 190, borderRadius: "50%", border: `2px solid ${SP.blue}`, bgcolor: "rgba(8,119,249,.14)", color: SP.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                Drag to set radius
              </Box>
            </Box>
            <Stack spacing={2}>
              <TextField label="Geofence name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer site or service area" />
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth label="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                <TextField fullWidth label="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </Stack>
              <TextField label="Radius (miles)" value={form.radius_miles} onChange={(e) => setForm({ ...form, radius_miles: e.target.value })} />
              <FormControlLabel control={<Switch checked={form.trigger_entry} onChange={(e) => setForm({ ...form, trigger_entry: e.target.checked })} />} label="Entry alert" />
              <FormControlLabel control={<Switch checked={form.trigger_exit} onChange={(e) => setForm({ ...form, trigger_exit: e.target.checked })} />} label="Exit alert" />
              <FormControlLabel control={<Switch checked={form.after_hours} onChange={(e) => setForm({ ...form, after_hours: e.target.checked })} />} label="After-hours alert" />
              <PrimaryButton onClick={handleSave}>Save geofence</PrimaryButton>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
