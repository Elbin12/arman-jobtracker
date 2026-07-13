"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Trash2, RotateCw, Calendar } from "lucide-react"
import {
  useDeleteJobMutation,
  useDeleteJobSeriesMutation,
  useDeleteJobRecurringSeriesMutation,
} from "../../../store/api/jobsApi"
import { hasRecurringSeriesId, isRecurringJob } from "../../../utils/recurringJobUtils"

export function DeleteJobDialog({ job, open, onClose, onDelete, disabled = false }) {
  const [deleteOption, setDeleteOption] = useState("single")
  const [deleting, setDeleting] = useState(false)
  const [deleteJob] = useDeleteJobMutation()
  const [deleteJobSeries] = useDeleteJobSeriesMutation()
  const [deleteJobRecurringSeries] = useDeleteJobRecurringSeriesMutation()

  const recurringJob = isRecurringJob(job)
  const hasSeriesId = hasRecurringSeriesId(job)

  useEffect(() => {
    if (!open) {
      setDeleteOption("single")
    }
  }, [open])

  const handleDelete = async () => {
    if (!job) return

    setDeleting(true)
    try {
      if (deleteOption === "sequence" && recurringJob) {
        if (hasSeriesId) {
          await deleteJobSeries(job.series_id).unwrap()
        } else {
          const jobId = job.job_id || job.id
          if (!jobId) {
            setDeleting(false)
            return
          }
          await deleteJobRecurringSeries(jobId).unwrap()
        }
      } else {
        const jobId = job.job_id || job.id
        if (!jobId) {
          setDeleting(false)
          return
        }
        await deleteJob(jobId).unwrap()
      }

      if (onDelete) {
        onDelete(job, deleteOption)
      }

      onClose()
    } catch (error) {
      // Error handled by toast notification
    } finally {
      setDeleting(false)
    }
  }

  const getDeleteDescription = () => {
    if (!recurringJob) {
      return `Are you sure you want to delete "${job?.title}"? This action cannot be undone.`
    }

    if (deleteOption === "single") {
      return `Are you sure you want to delete this single occurrence of "${job?.title}"? Other recurring jobs will remain scheduled.`
    }

    return `Are you sure you want to delete ALL recurring jobs for "${job?.title}"? This will delete the entire recurring sequence. This action cannot be undone.`
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !deleting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Job
          </DialogTitle>
          <DialogDescription>
            You're about to delete "{job?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {recurringJob && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Choose deletion option:</Label>
              <RadioGroup value={deleteOption} onValueChange={setDeleteOption}>
                <div className="flex items-start space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="single" id="single" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="single" className="flex items-center gap-2 font-semibold cursor-pointer">
                      <Calendar className="h-4 w-4" />
                      Delete this job only
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Remove only this scheduled occurrence. The recurring pattern continues.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="sequence" id="sequence" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="sequence" className="flex items-center gap-2 font-semibold cursor-pointer">
                      <RotateCw className="h-4 w-4" />
                      Delete all recurring jobs
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Remove all jobs in this recurring sequence permanently.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          <Alert variant="destructive">
            <AlertDescription>
              {getDeleteDescription()}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting || disabled}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || disabled}>
            {deleting
              ? "Deleting..."
              : recurringJob && deleteOption === "sequence"
                ? "Delete All Recurring Jobs"
                : "Delete Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteJobDialog
