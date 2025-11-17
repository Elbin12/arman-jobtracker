"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
} from "@mui/material"
import { Delete as DeleteIcon, RotateRight as RotateIcon, EventNote as EventIcon } from "@mui/icons-material"

export function DeleteJobDialog({ job, open, onClose, onDelete, disabled = false }) {
  const [deleteOption, setDeleteOption] = useState("single")
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      onDelete(job, deleteOption)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const getDeleteDescription = () => {
    if (!job?.is_recurring) {
      return `Are you sure you want to delete "${job?.title}"? This action cannot be undone.`
    }

    if (deleteOption === "single") {
      return `Are you sure you want to delete this single occurrence of "${job?.title}"? Other recurring appointments will remain scheduled.`
    } else {
      return `Are you sure you want to delete ALL recurring appointments for "${job?.title}"? This will delete the entire recurring sequence. This action cannot be undone.`
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DeleteIcon sx={{ color: "error.main" }} />
        Delete Job
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            You're about to delete "{job?.title}"
          </Typography>

          {job?.is_recurring && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Choose deletion option:
              </Typography>
              <RadioGroup value={deleteOption} onChange={(e) => setDeleteOption(e.target.value)}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                  }}
                >
                  <FormControlLabel
                    value="single"
                    control={<Radio />}
                    label={
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <EventIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            Delete this job only
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Remove only this scheduled occurrence. The recurring pattern continues.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 2,
                  }}
                >
                  <FormControlLabel
                    value="sequence"
                    control={<Radio />}
                    label={
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <RotateIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            Delete entire sequence
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Remove all jobs in this recurring sequence permanently.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </RadioGroup>
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            {getDeleteDescription()}
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Job"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteJobDialog
