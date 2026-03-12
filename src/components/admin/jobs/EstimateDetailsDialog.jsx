"use client";

import { useState, useEffect } from "react";
import moment from "moment-timezone";
import { User, MapPin, Phone, Mail, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDispatch } from "react-redux";
import {
  jobsApi,
  useUpdateEstimateStatusMutation,
  useDeleteEstimateMutation,
} from "../../../store/api/jobsApi";
import { getEstimateAddress } from "../../../utils/geocode";

export function EstimateDetailsDialog({
  estimate,
  open,
  onOpenChange,
  estimatesParams,
  user,
  onDeleted,
}) {
  const [deleteEstimateDialogOpen, setDeleteEstimateDialogOpen] = useState(false);
  const [localEstimate, setLocalEstimate] = useState(estimate);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [updateEstimateStatus, { isLoading: isUpdatingEstimate }] = useUpdateEstimateStatusMutation();
  const [deleteEstimate, { isLoading: isDeletingEstimate }] = useDeleteEstimateMutation();

  useEffect(() => {
    if (estimate) setLocalEstimate(estimate);
    else setLocalEstimate(null);
  }, [estimate]);

  const displayEstimate = localEstimate || estimate;
  if (!displayEstimate) return null;

  const handleEstimateStatusChange = async (newStatus) => {
    if (!displayEstimate?.appointment_id) {
      toast({
        title: "Error",
        description: "Estimate information is missing",
        variant: "destructive",
      });
      return;
    }

    const currentStatus = displayEstimate.estimate_status ?? displayEstimate.appointment_status;
    if (newStatus === currentStatus) {
      setLocalEstimate((prev) => (prev ? { ...prev, estimate_status: newStatus } : prev));
      return;
    }

    try {
      await updateEstimateStatus({
        id: displayEstimate.appointment_id,
        estimate_status: newStatus,
      }).unwrap();

      const updated = { ...displayEstimate, estimate_status: newStatus };
      setLocalEstimate(updated);

      if (estimatesParams) {
        dispatch(
          jobsApi.util.updateQueryData("getEstimateAppointmentsCalendar", estimatesParams, (draft) => {
            if (Array.isArray(draft)) {
              const index = draft.findIndex((e) => e.appointment_id === displayEstimate.appointment_id);
              if (index !== -1) draft[index] = { ...draft[index], estimate_status: newStatus };
            } else if (draft?.results) {
              const index = draft.results.findIndex((e) => e.appointment_id === displayEstimate.appointment_id);
              if (index !== -1) draft.results[index] = { ...draft.results[index], estimate_status: newStatus };
            }
          })
        );
      }

      toast({
        title: "Success",
        description: "Estimate status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update estimate status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEstimate = async () => {
    if (!displayEstimate?.appointment_id) {
      toast({
        title: "Error",
        description: "Estimate information is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteEstimate(displayEstimate.appointment_id).unwrap();

      if (estimatesParams) {
        dispatch(
          jobsApi.util.updateQueryData("getEstimateAppointmentsCalendar", estimatesParams, (draft) => {
            if (Array.isArray(draft)) {
              const filtered = draft.filter((e) => e.appointment_id !== displayEstimate.appointment_id);
              draft.length = 0;
              draft.push(...filtered);
            } else if (draft?.results) {
              draft.results = draft.results.filter((e) => e.appointment_id !== displayEstimate.appointment_id);
            }
          })
        );
      }

      setDeleteEstimateDialogOpen(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete estimate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const address = displayEstimate.address || displayEstimate.contact_full_address || getEstimateAddress(displayEstimate);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) setLocalEstimate(null);
          onOpenChange(o);
        }}
      >
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col p-0 sm:p-6"
          onInteractOutside={(e) => {
            const target = e.target;
            if (target && (target.closest('[role="listbox"]') || target.closest('[data-radix-portal]'))) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex-shrink-0 px-4 pt-6 pb-4 sm:px-0 sm:pt-0">
            <DialogHeader>
              <DialogTitle>Estimate Details</DialogTitle>
              <DialogDescription>View estimate information</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-0 sm:pb-0 min-h-0">
            <div className="space-y-4">
              {/* Customer Information Section */}
              <div className="space-y-3 pb-4 border-b">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer Information
                </Label>
                <div className="space-y-2.5">
                  {displayEstimate.contact_name && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground flex-shrink-0" />
                      {displayEstimate.ghl_contact_id ? (
                        <a
                          href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || "https://app.theservicepilot.com"}/v2/location/${import.meta.env.VITE_LOCATION_ID || "b8qvo7VooP3JD3dIZU42"}/contacts/detail/${displayEstimate.ghl_contact_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                        >
                          {displayEstimate.contact_name}
                        </a>
                      ) : (
                        <span className="text-sm">{displayEstimate.contact_name}</span>
                      )}
                    </div>
                  )}

                  {address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <a
                        href={`${import.meta.env.VITE_GOOGLE_MAPS_SEARCH_URL || "https://www.google.com/maps/search/?api=1&query="}${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80 cursor-pointer hover:underline transition-all duration-200"
                      >
                        {address}
                      </a>
                    </div>
                  )}

                  {(displayEstimate.contact_phone || displayEstimate.customer_phone || displayEstimate.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${displayEstimate.contact_phone || displayEstimate.customer_phone || displayEstimate.phone}`}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                      >
                        {displayEstimate.contact_phone || displayEstimate.customer_phone || displayEstimate.phone}
                      </a>
                    </div>
                  )}

                  {(displayEstimate.contact_email || displayEstimate.customer_email || displayEstimate.email) && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-muted-foreground flex-shrink-0" />
                      <a
                        href={`mailto:${displayEstimate.contact_email || displayEstimate.customer_email || displayEstimate.email}`}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                      >
                        {displayEstimate.contact_email || displayEstimate.customer_email || displayEstimate.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimate Details Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Title</Label>
                  <span className="text-sm">{displayEstimate.title || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Assigned To</Label>
                  <span className="text-sm">{displayEstimate.assigned_user_name || "Unassigned"}</span>
                </div>

                {displayEstimate.calendar && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Calendar</Label>
                    <a
                      href={`${import.meta.env.VITE_SERVICE_PILOT_APP_URL || "https://app.theservicepilot.com"}/v2/location/${import.meta.env.VITE_LOCATION_ID || "b8qvo7VooP3JD3dIZU42"}/calendars/view?user_ids=${user?.ghl_user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 decoration-primary/30 hover:decoration-primary/60 transition-all duration-200 flex items-center gap-1.5 font-medium"
                    >
                      {displayEstimate.calendar.name || "View Calendar"}
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Status</Label>
                  <Select
                    value={displayEstimate.estimate_status ?? displayEstimate.appointment_status ?? ""}
                    onValueChange={handleEstimateStatusChange}
                    disabled={isUpdatingEstimate}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent
                      className="z-[1300] !fixed"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      onEscapeKeyDown={(e) => e.stopPropagation()}
                      onPointerDownOutside={(e) => {
                        const target = e.target;
                        if (target?.hasAttribute?.("data-radix-dialog-overlay")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="on_my_way">On My Way</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Start Time</Label>
                  <div className="text-sm">
                    {displayEstimate.start_time
                      ? moment.utc(displayEstimate.start_time).tz("America/Chicago").format("MMMM D, YYYY h:mm A")
                      : "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">End Time</Label>
                  <div className="text-sm">
                    {displayEstimate.end_time
                      ? moment.utc(displayEstimate.end_time).tz("America/Chicago").format("MMMM D, YYYY h:mm A")
                      : "N/A"}
                  </div>
                </div>
                {displayEstimate.notes && (
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Notes</Label>
                    <div className="text-sm whitespace-pre-wrap">{displayEstimate.notes}</div>
                  </div>
                )}
                {displayEstimate.source && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Source</Label>
                    <span className="text-sm">{displayEstimate.source}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Users Count</Label>
                  <span className="text-sm">{displayEstimate.users_count || 0}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setDeleteEstimateDialogOpen(true)}
                  className="w-full"
                  disabled={isDeletingEstimate}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Estimate
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Estimate Confirmation Dialog */}
      <Dialog
        open={deleteEstimateDialogOpen}
        onOpenChange={(o) => {
          if (!isDeletingEstimate) setDeleteEstimateDialogOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Estimate
            </DialogTitle>
            <DialogDescription>
              You're about to delete "{displayEstimate?.title || "this estimate"}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                Are you sure you want to delete "{displayEstimate?.title || "this estimate"}"? This action cannot be
                undone.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteEstimateDialogOpen(false)}
              disabled={isDeletingEstimate}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEstimate} disabled={isDeletingEstimate}>
              {isDeletingEstimate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EstimateDetailsDialog;
