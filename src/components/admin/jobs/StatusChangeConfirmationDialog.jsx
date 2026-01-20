"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"

export function StatusChangeConfirmationDialog({ 
  job, 
  newStatus, 
  open, 
  onClose, 
  onConfirm,
  isUpdating = false 
}) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-600",
          iconBg: "bg-green-50",
          title: "Complete Job",
          description: `Are you sure you want to mark "${job?.title || 'this job'}" as completed?`,
          message: "This will mark the job as finished. The job status will be updated and cannot be easily reverted.",
          confirmText: "Complete Job",
          confirmVariant: "default",
          alertVariant: "default",
        }
      case "cancelled":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          iconBg: "bg-red-50",
          title: "Cancel Job",
          description: `Are you sure you want to cancel "${job?.title || 'this job'}"?`,
          message: "This action will mark the job as cancelled. You may need to manually update related records.",
          confirmText: "Cancel Job",
          confirmVariant: "destructive",
          alertVariant: "destructive",
        }
      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
          title: "Change Job Status",
          description: `Are you sure you want to change the status of "${job?.title || 'this job'}"?`,
          message: "This will update the job status. Please confirm to proceed.",
          confirmText: "Update Status",
          confirmVariant: "default",
          alertVariant: "default",
        }
    }
  }

  const config = getStatusConfig(newStatus)
  const Icon = config.icon

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(newStatus)
    }
  }

  const formatStatusLabel = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isUpdating && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <span>{config.title}</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Information */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Status</span>
              <span className="text-sm font-semibold capitalize">
                {formatStatusLabel(job?.status || 'unknown')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">New Status</span>
              <span className="text-sm font-semibold capitalize">
                {formatStatusLabel(newStatus)}
              </span>
            </div>
            {job?.customer_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Customer</span>
                <span className="text-sm font-medium">{job.customer_name}</span>
              </div>
            )}
          </div>

          {/* Alert Message */}
          <Alert variant={config.alertVariant}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {config.message}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isUpdating}
            className="sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <Button 
            variant={config.confirmVariant}
            onClick={handleConfirm} 
            disabled={isUpdating}
            className="sm:min-w-[120px]"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              config.confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StatusChangeConfirmationDialog

