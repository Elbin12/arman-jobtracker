"use client";

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
} from "lucide-react";
import moment from "moment-timezone";

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#06b6d4",
  service_due: "#a855f7",
  on_the_way: "#f97316",
  in_progress: "#3b82f6",
  onhold: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const PRIORITY_LABELS = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

export function MapJobPopup({ job, onEdit, onViewJob }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    return moment.utc(dateString).format("MMM D, YYYY · h:mm A");
  };

  const statusColor = STATUS_COLORS[job?.status] || "#6b7280";
  const priorityStr = String(job?.priority || "low").toLowerCase();
  const priorityLabel = PRIORITY_LABELS[priorityStr] || "Low Priority";

  const address = job?.job_address || job?.customer_address || "";
  const phone = job?.contact_details?.phone || job?.customer_phone || "";
  const email = job?.contact_details?.email || job?.customer_email || "";
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
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
          {job?.title || "Job"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {job?.customer_name || "—"}
        </Typography>
      </Box>

      {/* Status & Priority */}
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
        {job?.status && (
          <Chip
            size="small"
            label={job.status.replace(/_/g, " ")}
            sx={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          />
        )}
        <Chip
          size="small"
          label={priorityLabel}
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Contact & Schedule */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
        {phone && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Phone size={14} />
            <a
              href={`tel:${phone}`}
              style={{
                fontSize: "0.8125rem",
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              {phone}
            </a>
          </Box>
        )}
        {email && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Mail size={14} />
            <a
              href={`mailto:${email}`}
              style={{
                fontSize: "0.8125rem",
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              {email}
            </a>
          </Box>
        )}
        {job?.scheduled_at && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Calendar size={14} />
            <Typography variant="body2">{formatDate(job.scheduled_at)}</Typography>
          </Box>
        )}
        {job?.estimated_duration && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Clock size={14} />
            <Typography variant="body2">{job.estimated_duration} hrs</Typography>
          </Box>
        )}
        {job?.assigned_to_name && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <User size={14} />
            <Typography variant="body2">{job.assigned_to_name}</Typography>
          </Box>
        )}
      </Box>

      {/* Services */}
      {job?.service_names?.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            SERVICES
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }}>
            {job.service_names.join(", ")}
          </Typography>
        </>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(job);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#2563eb",
              background: "#eff6ff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <Edit size={14} />
            Edit Job
          </button>
        )}
        {onViewJob && (
          <a
            href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || "https://app.theservicepilot.com"}/v2/location/${import.meta.env.VITE_LOCATION_ID || ""}/contacts/detail/${job?.ghl_contact_id}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#374151",
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={14} />
            View Contact
          </a>
        )}
      </Box>
    </Box>
  );
}

export default MapJobPopup;
