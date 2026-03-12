"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Box, Typography, Button, Badge } from "@mui/material";
import { FilterIcon } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useGetCalendarJobsQuery, useGetEstimateAppointmentsCalendarQuery } from "../../store/api/jobsApi";
import { useGetEmployeesQuery } from "../../store/api/payrollApi";
import { useDispatch, useSelector } from "react-redux";
import { geocodeJobs, getEstimateAddress } from "../../utils/geocode";
import { FilterSidebar } from "./FilterSibdebar";
import MapJobCardWrapper from "../../components/admin/jobs/MapJobCardWrapper";
import MapEstimateDetailsContent from "../../components/admin/jobs/MapEstimateDetailsContent";
import { EditJobDialog } from "../../components/admin/jobs/EditJobDialog";
import { jobsApi } from "../../store/api/jobsApi";
import { startOfMonth, endOfMonth } from "date-fns";

const MAP_DEFAULT_CENTER = { lat: 29.7604, lng: -95.3698 }; // Houston, TX
const MAP_DEFAULT_ZOOM = 10;

const getDefaultDateRange = () => {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
};

export function JobsMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const popupDivRef = useRef(null);
  const [selectedJobIdForPopup, setSelectedJobIdForPopup] = useState(null);
  const [selectedEstimateForPopup, setSelectedEstimateForPopup] = useState(null);

  const [dateRange, setDateRange] = useState(() => getDefaultDateRange());
  const [filterParams, setFilterParams] = useState({});
  const [selectedCategories, setSelectedCategories] = useState({ jobs: true, estimates: true });
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [geocodedJobs, setGeocodedJobs] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role || "worker";

  // Build params for occurrences API (api/job/occurrences/)
  const occurrencesParams = useMemo(() => {
    const params = {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    };
    const status = filterParams.job_status || filterParams.status;
    if (status?.trim()) params.status = status;
    const search = filterParams.job_search || filterParams.search;
    if (search?.trim()) params.search = search;
    if (filterParams.job_type?.trim()) params.job_type = filterParams.job_type;
    if (filterParams.assignee_ids) {
      const ids = typeof filterParams.assignee_ids === "string"
        ? filterParams.assignee_ids.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean)
        : Array.isArray(filterParams.assignee_ids) ? filterParams.assignee_ids : [];
      if (ids.length > 0) params.assignee_ids = ids.join(",");
    }
    return params;
  }, [dateRange.start, dateRange.end, filterParams.job_status, filterParams.status, filterParams.job_search, filterParams.search, filterParams.job_type, filterParams.assignee_ids]);

  const estimatesParams = useMemo(() => {
    const params = {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    };
    if (filterParams.estimate_status?.trim()) params.status = filterParams.estimate_status;
    const search = filterParams.estimate_search || filterParams.search;
    if (search?.trim()) params.search = search;
    if (filterParams.assignee_ids) {
      const ids = typeof filterParams.assignee_ids === "string"
        ? filterParams.assignee_ids.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean)
        : Array.isArray(filterParams.assignee_ids) ? filterParams.assignee_ids : [];
      if (ids.length > 0) params.assigned_user_ids = ids.join(",");
    }
    return params;
  }, [dateRange.start, dateRange.end, filterParams.estimate_status, filterParams.estimate_search, filterParams.search, filterParams.assignee_ids]);

  const showJobs = selectedCategories.jobs !== false;
  const showEstimates = selectedCategories.estimates !== false;

  // Always fetch both so geocoding has full data; category filtering is display-only
  const { data: occurrencesData, isLoading: jobsLoading } = useGetCalendarJobsQuery(occurrencesParams);
  const { data: estimatesData, isLoading: estimatesLoading } = useGetEstimateAppointmentsCalendarQuery(estimatesParams);
  const { data: assigneesData } = useGetEmployeesQuery({ is_active: true });
  const users = assigneesData?.results || [];

  const jobs = Array.isArray(occurrencesData) ? occurrencesData : occurrencesData?.results ?? [];
  const estimates = Array.isArray(estimatesData) ? estimatesData : estimatesData?.results ?? [];

  const activeFilterCount = Object.keys(filterParams).filter(
    (key) =>
      filterParams[key] &&
      (Array.isArray(filterParams[key]) ? filterParams[key].length > 0 : true)
  ).length;

  // Load Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey || !mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => {
        const map = new google.maps.Map(mapRef.current, {
          center: MAP_DEFAULT_CENTER,
          zoom: MAP_DEFAULT_ZOOM,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        mapInstanceRef.current = map;
        const infoWindow = new google.maps.InfoWindow({
          maxWidth: 420,
        });
        infoWindow.addListener("closeclick", () => {
          setSelectedJobIdForPopup(null);
          setSelectedEstimateForPopup(null);
        });
        infoWindowRef.current = infoWindow;
        setMapReady(true);
      })
      .catch((err) => {
        console.error("Google Maps load error:", err);
      });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      markersRef.current.forEach((m) => m?.setMap?.(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, []);

  // Geocode jobs and estimates (always geocode all data; category filtering is applied for display)
  useEffect(() => {
    const jobItems = jobs
      .filter((j) => {
        const addr = j.job_address || j.customer_address;
        return addr && String(addr).trim();
      })
      .map((job) => ({
        address: (job.job_address || job.customer_address || "").trim(),
        item: { ...job, __type: "job" },
      }));

    const estimateItems = estimates
      .filter((e) => {
        const addr = getEstimateAddress(e);
        return addr && String(addr).trim();
      })
      .map((estimate) => ({
        address: getEstimateAddress(estimate).trim(),
        item: { ...estimate, __type: "estimate" },
      }));

    const allItems = [...jobItems, ...estimateItems];
    if (!mapReady || allItems.length === 0) {
      setGeocodedJobs([]);
      setGeocoding(false);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const byAddress = new Map();
    allItems.forEach(({ address, item }) => {
      if (!byAddress.has(address)) byAddress.set(address, []);
      byAddress.get(address).push(item);
    });

    let cancelled = false;
    setGeocoding(true);

    const run = async () => {
      const uniqueItems = Array.from(byAddress.entries()).map(([address, itemsAtAddress]) => ({
        address,
        job: itemsAtAddress[0],
      }));

      const results = await geocodeJobs(
        uniqueItems.map(({ address, job }) => ({ address, job })),
        geocoder,
        60
      );

      if (cancelled) return;

      const addressToCoords = new Map();
      results.forEach((r) => {
        const addr =
          r.job.__type === "job"
            ? (r.job.job_address || r.job.customer_address || "").trim()
            : getEstimateAddress(r.job).trim();
        if (!addressToCoords.has(addr)) addressToCoords.set(addr, { lat: r.lat, lng: r.lng });
      });

      const withCoords = [];
      jobItems.forEach(({ address, item }) => {
        const coords = addressToCoords.get(address);
        if (coords) withCoords.push({ ...item, ...coords });
      });
      estimateItems.forEach(({ address, item }) => {
        const coords = addressToCoords.get(address);
        if (coords) withCoords.push({ ...item, ...coords });
      });

      setGeocodedJobs(withCoords);
      setGeocoding(false);
    };

    run();
    return () => {
      cancelled = true;
      setGeocoding(false);
    };
  }, [mapReady, jobs, estimates]);

  // Filter geocoded items by selected categories (instant, no re-geocoding)
  const displayedGeocodedJobs = useMemo(() => {
    return geocodedJobs.filter(
      (item) =>
        (item.__type === "job" && showJobs) || (item.__type === "estimate" && showEstimates)
    );
  }, [geocodedJobs, showJobs, showEstimates]);

  // Update markers when displayed geocoded jobs change (with clustering)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !google.maps) return;

    // Clear previous clusterer and markers
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markersRef.current.forEach((m) => m?.setMap?.(null));
    markersRef.current = [];

    const statusColors = {
      pending: "#f59e0b",
      confirmed: "#06b6d4",
      service_due: "#a855f7",
      on_the_way: "#f97316",
      in_progress: "#3b82f6",
      onhold: "#8b5cf6",
      completed: "#10b981",
      cancelled: "#ef4444",
    };

    const openPopup = (item, marker) => {
      const div = document.createElement("div");
      div.style.maxHeight = "70vh";
      div.style.overflowY = "auto";
      div.style.overflowX = "hidden";
      popupDivRef.current = div;
      if (item.__type === "estimate") {
        setSelectedJobIdForPopup(null);
        setSelectedEstimateForPopup(item);
      } else {
        const jobId = item.job_id || item.id;
        if (!jobId) return;
        setSelectedEstimateForPopup(null);
        setSelectedJobIdForPopup(jobId);
      }
      infoWindowRef.current.setContent(div);
      infoWindowRef.current.open(map, marker);
    };

    const markers = [];
    displayedGeocodedJobs.forEach((item) => {
      const isEstimate = item.__type === "estimate";
      const color = isEstimate
        ? "#14b8a6"
        : (statusColors[item.status] || "#6b7280");
      const title = isEstimate
        ? item.title || item.contact_name || "Estimate"
        : item.customer_name || item.job_address || item.customer_address || "Job";
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        title: isEstimate ? `Estimate: ${title}` : title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => openPopup(item, marker));
      markers.push(marker);
    });

    markersRef.current = markers;

    if (markers.length > 0) {
      const noCountRenderer = {
        render: ({ position }) =>
          new google.maps.Marker({
            position,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 18,
              fillColor: "#4285f4",
              fillOpacity: 0.6,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
            zIndex: 1000,
          }),
      };
      clustererRef.current = new MarkerClusterer({ map, markers, renderer: noCountRenderer });
      const bounds = new google.maps.LatLngBounds();
      displayedGeocodedJobs.forEach((j) => bounds.extend({ lat: j.lat, lng: j.lng }));
      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      markersRef.current.forEach((m) => m?.setMap?.(null));
      markersRef.current = [];
    };
  }, [displayedGeocodedJobs]);

  const handleJobUpdate = useCallback(
    (result) => {
      const jobId = result.id || result.job_id;
      if (!jobId) return;
      dispatch(
        jobsApi.util.updateQueryData(
          "getCalendarJobs",
          occurrencesParams,
          (draft) => {
            const list = Array.isArray(draft) ? draft : draft?.results ?? [];
            const index = list.findIndex(
              (j) => j.id === jobId || j.job_id === jobId
            );
            if (index !== -1) {
              list[index] = {
                ...list[index],
                ...result,
                id: result.id || result.job_id || list[index].id,
                job_id: result.job_id || result.id || list[index].job_id,
              };
              if (!Array.isArray(draft) && draft?.results) draft.results = list;
            }
          }
        )
      );
    },
    [dispatch, occurrencesParams]
  );

  const handleEditFromPopup = useCallback((j) => {
    setSelectedJob(j);
    setEditDialogOpen(true);
    infoWindowRef.current?.close();
  }, []);

  const handleDeleteFromPopup = useCallback(
    (jobToDelete, option) => {
      if (!jobToDelete) return;
      const jobId = jobToDelete.job_id || jobToDelete.id;
      if (!jobId) return;
      dispatch(
        jobsApi.util.updateQueryData("getCalendarJobs", occurrencesParams, (draft) => {
          const list = Array.isArray(draft) ? draft : draft?.results ?? [];
          const idx = list.findIndex((j) => j.id === jobId || j.job_id === jobId);
          if (idx !== -1) {
            list.splice(idx, 1);
            if (!Array.isArray(draft) && draft?.results) draft.results = list;
          }
        })
      );
      infoWindowRef.current?.close();
      setSelectedJobIdForPopup(null);
    },
    [dispatch, occurrencesParams]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 200px)" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Map
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View jobs and estimates by location within a date range. Click a marker for details.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
            <DatePicker
              label="Start Date"
              value={dateRange.start}
              onChange={(date) => date && setDateRange((prev) => ({ ...prev, start: date }))}
              slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
            />
            <DatePicker
              label="End Date"
              value={dateRange.end}
              onChange={(date) => date && setDateRange((prev) => ({ ...prev, end: date }))}
              slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon size={18} />}
              onClick={() => setFilterSidebarOpen(true)}
              aria-label={
                activeFilterCount > 0 ? `Manage filters (${activeFilterCount} active)` : "Manage filters"
              }
              sx={{ minHeight: 44, minWidth: 44 }}
            >
              <Badge badgeContent={activeFilterCount} color="primary">
                <Box sx={{ mr: activeFilterCount > 0 ? 2 : 0 }}>Manage Filters</Box>
              </Badge>
            </Button>
          </Box>
        </Box>

      {/* Map container */}
      <Box
        sx={{
          flex: 1,
          minHeight: 420,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
        }}
      >
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "100%",
            minHeight: 420,
          }}
        />
        {(jobsLoading || estimatesLoading || geocoding) && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: "background.paper",
              boxShadow: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {jobsLoading || estimatesLoading ? "Loading…" : "Geocoding addresses…"}
            </Typography>
          </Box>
        )}
        {mapReady && !jobsLoading && !estimatesLoading && !geocoding && geocodedJobs.length === 0 && (jobs.length > 0 || estimates.length > 0) && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: "warning.light",
              color: "warning.contrastText",
            }}
          >
            <Typography variant="body2">
              No valid addresses to show on map. Check job addresses.
            </Typography>
          </Box>
        )}
        {mapReady && !jobsLoading && !estimatesLoading && jobs.length === 0 && estimates.length === 0 && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">No jobs or estimates in the selected date range. Try adjusting the dates or filters.</Typography>
          </Box>
        )}
      </Box>

      {/* Results count */}
      {!jobsLoading && !estimatesLoading && (() => {
        const jobCount = displayedGeocodedJobs.filter((i) => i.__type !== "estimate").length;
        const estimateCount = displayedGeocodedJobs.filter((i) => i.__type === "estimate").length;
        const total = (showJobs ? jobs.length : 0) + (showEstimates ? estimates.length : 0);
        const onMap = displayedGeocodedJobs.length;
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {onMap} of {total} ({(jobCount)} job{jobCount !== 1 ? "s" : ""}, {estimateCount} estimate{estimateCount !== 1 ? "s" : ""}) with valid addresses on map
          </Typography>
        );
      })()}

      <FilterSidebar
        open={filterSidebarOpen}
        onClose={() => setFilterSidebarOpen(false)}
        onApplyFilters={(filters) => setFilterParams(filters)}
        assignees={users}
        initialFilters={filterParams}
        userRole={userRole}
        mode="map"
        selectedCategories={selectedCategories}
        onCategoryToggle={(cat, checked) =>
          setSelectedCategories((prev) => ({ ...prev, [cat]: checked }))
        }
      />

      {popupDivRef.current &&
        (selectedJobIdForPopup
          ? createPortal(
              <MapJobCardWrapper
                jobId={selectedJobIdForPopup}
                users={users}
                onEdit={handleEditFromPopup}
                onDelete={handleDeleteFromPopup}
                onUpdate={handleJobUpdate}
              />,
              popupDivRef.current
            )
          : selectedEstimateForPopup
            ? createPortal(
                <MapEstimateDetailsContent
                  estimate={selectedEstimateForPopup}
                  estimatesParams={estimatesParams}
                  user={user}
                  onDeleted={() => {
                    infoWindowRef.current?.close();
                    setSelectedEstimateForPopup(null);
                  }}
                />,
                popupDivRef.current
              )
            : null)}

      {selectedJob && (
        <EditJobDialog
          job={selectedJob}
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedJob(null);
          }}
          users={users}
          handleJobUpdate={handleJobUpdate}
        />
      )}
      </Box>
    </LocalizationProvider>
  );
}

export default JobsMap;
