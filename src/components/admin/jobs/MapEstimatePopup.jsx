"use client";

import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { MapPin, User, Calendar } from "lucide-react";
import moment from "moment-timezone";
import { getEstimateAddress } from "../../../utils/geocode";

const ESTIMATE_STATUS_COLORS = {
  confirmed: "#06b6d4",
  quoted: "#f97316",
  accepted: "#10b981",
  rejected: "#ef4444",
};

export function MapEstimatePopup({ estimate }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    return moment.utc(dateString).format("MMM D, YYYY · h:mm A");
  };

  const status = estimate?.estimate_status ?? estimate?.appointment_status ?? "confirmed";
  const statusColor = ESTIMATE_STATUS_COLORS[status] || "#6b7280";

  const address = getEstimateAddress(estimate);

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 360,
        p: 2,
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Chip
          size="small"
          label="Estimate"
          sx={{
            backgroundColor: "#14b8a620",
            color: "#14b8a6",
            fontWeight: 600,
            mb: 1,
          }}
        />
        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
          {estimate?.title || "Estimate"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {estimate?.contact_name || estimate?.company_name || "—"}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
        <Chip
          size="small"
          label={(status || "confirmed").replace(/_/g, " ")}
          sx={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}>
        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <MapPin size={14} style={{ marginTop: 3, flexShrink: 0 }} />
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.8125rem",
                  color: "#2563eb",
                  textDecoration: "none",
                }}
              >
                {address}
              </a>
            ) : (
              <Typography variant="body2">{address}</Typography>
            )}
          </Box>
        )}
        {estimate?.start_time && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Calendar size={14} />
            <Typography variant="body2">{formatDate(estimate.start_time)}</Typography>
          </Box>
        )}
        {estimate?.assigned_user_name && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <User size={14} />
            <Typography variant="body2">{estimate.assigned_user_name}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default MapEstimatePopup;
