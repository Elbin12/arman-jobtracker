"use client";

import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { useGetJobDetailsQuery } from "../../../store/api/jobsApi";
import { JobCard } from "./JobCard";

export function MapJobCardWrapper({ jobId, users = [], onEdit, onDelete, onUpdate }) {
  const { data: job, isLoading, isError } = useGetJobDetailsQuery(jobId, {
    skip: !jobId,
  });

  if (!jobId) return null;
  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", minWidth: 280 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (isError || !job) {
    return (
      <Box sx={{ p: 2, minWidth: 200 }}>
        Failed to load job details.
      </Box>
    );
  }

  return (
    <Box sx={{ width: 380, maxWidth: "90vw" }}>
      <JobCard
        job={job}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdate={onUpdate}
        users={users}
      />
    </Box>
  );
}

export default MapJobCardWrapper;
