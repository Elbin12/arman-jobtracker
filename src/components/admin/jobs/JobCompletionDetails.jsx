"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useUploadJobImageMutation, useUpdateJobPaymentMethodMutation, useGetJobDetailsQuery, useDeleteJobImageMutation } from "@/store/api/jobsApi"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2, CheckCircle2, DollarSign, Image as ImageIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Box, Typography, Divider } from "@mui/material"

const PAYMENT_METHOD_CHOICES = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'check', label: 'Check' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online_payment', label: 'Online Payment' },
  { value: 'other', label: 'Other' },
]

export function JobCompletionDetails({ job, onUpdate }) {
  const [newImages, setNewImages] = useState([]) // New images to upload
  const [paymentMethod, setPaymentMethod] = useState(job?.payment_method || "")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState(null)
  const fileInputRef = useRef(null)
  const { toast } = useToast()
  
  const [uploadJobImage] = useUploadJobImageMutation()
  const [updatePaymentMethod] = useUpdateJobPaymentMethodMutation()
  const [deleteJobImage, { isLoading: isDeletingImage }] = useDeleteJobImageMutation()

  const jobId = job?.job_id || job?.id
  
  // Fetch fresh job data to get updated images
  const { data: freshJobData, refetch: refetchJob } = useGetJobDetailsQuery(jobId, {
    skip: !jobId,
  })

  // Get existing images from job data (prefer fresh data, fallback to job prop)
  const existingImages = freshJobData?.images || job?.images || []
  
  // Update payment method when job data changes
  useEffect(() => {
    const currentPaymentMethod = freshJobData?.payment_method || job?.payment_method || ""
    if (currentPaymentMethod && currentPaymentMethod !== paymentMethod) {
      setPaymentMethod(currentPaymentMethod)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshJobData?.payment_method, job?.payment_method])

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const imagesToAdd = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false,
    }))
    setNewImages(prev => [...prev, ...imagesToAdd])
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeNewImage = (imageId) => {
    setNewImages(prev => {
      const image = prev.find(img => img.id === imageId)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const handleDeleteExistingImage = (imageId) => {
    if (!imageId || isDeletingImage || isProcessing) return
    
    try {
      setImageToDelete(imageId)
      setDeleteImageDialogOpen(true)
    } catch (error) {
      console.error('Error opening delete dialog:', error)
      toast({
        title: "Error",
        description: "Failed to open delete confirmation.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteImage = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!imageToDelete || isDeletingImage) {
      setDeleteImageDialogOpen(false)
      setImageToDelete(null)
      return
    }

    try {
      const imageIdToDelete = imageToDelete
      await deleteJobImage(imageIdToDelete).unwrap()
      
      // Close dialog immediately
      setDeleteImageDialogOpen(false)
      setImageToDelete(null)
      
      toast({
        title: "Success",
        description: "Image deleted successfully.",
      })
      
      // Refetch job data to update the images list
      try {
        await refetchJob()
      } catch (refetchError) {
        console.error('Error refetching job:', refetchError)
      }
      
      // Also trigger onUpdate to refresh parent component
      if (onUpdate && freshJobData) {
        try {
          const updatedImages = existingImages.filter(img => img.id !== imageIdToDelete)
          onUpdate({ ...freshJobData, images: updatedImages })
        } catch (updateError) {
          console.error('Error updating parent:', updateError)
        }
      }
    } catch (error) {
      console.error('Delete image error:', error)
      toast({
        title: "Delete Failed",
        description: error?.data?.message || "Failed to delete image. Please try again.",
        variant: "destructive",
      })
      // Keep dialog open on error so user can retry
    }
  }

  const uploadImage = async (image) => {
    if (!jobId || !image.file) return

    setNewImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, uploading: true } : img
    ))

    try {
      const formData = new FormData()
      formData.append('job', jobId)
      formData.append('image', image.file)

      await uploadJobImage(formData).unwrap()
      setNewImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploaded: true, uploading: false } : img
      ))
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error?.data?.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setNewImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploading: false } : img
      ))
      throw error
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setUploadingImages(true)
    const errors = []

    // Upload all new images
    for (const image of newImages) {
      if (image.file && !image.uploaded) {
        try {
          await uploadImage(image)
        } catch (error) {
          errors.push(`Failed to upload ${image.file.name}`)
        }
      }
    }

    // Update payment method if changed and job is completed
    const isCompleted = job?.status === "completed"
    if (isCompleted) {
    const currentPaymentMethod = freshJobData?.payment_method || job?.payment_method || ""
    if (paymentMethod && paymentMethod !== currentPaymentMethod) {
      try {
        await updatePaymentMethod({
          id: jobId,
          payment_method: paymentMethod,
        }).unwrap()
      } catch (error) {
        errors.push("Failed to update payment method")
        toast({
          title: "Error",
          description: error?.data?.message || "Failed to update payment method. Please try again.",
          variant: "destructive",
        })
        }
      }
    }

    setUploadingImages(false)
    setSaving(false)

    if (errors.length > 0) {
      toast({
        title: "Some operations failed",
        description: errors.join(", "),
        variant: "destructive",
      })
    } else {
      // Clear new images from state
      setNewImages([])
      // Refetch job data to show newly uploaded images
      await refetchJob()
      // Also trigger onUpdate to refresh parent component
      if (onUpdate) {
        const updatedJob = freshJobData || job
        onUpdate({ ...updatedJob, payment_method: paymentMethod })
      }
      toast({
        title: "Success",
        description: "Changes saved successfully.",
      })
    }
  }

  const isCompleted = job?.status === "completed"
  const hasChanges = newImages.length > 0 || (isCompleted && paymentMethod && paymentMethod !== (freshJobData?.payment_method || job?.payment_method || ""))
  const isProcessing = uploadingImages || saving

  return (
    <Box sx={{ mb: 3 }}>
      <Divider sx={{ mb: 3 }} />
      {isCompleted && (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DollarSign size={18} />
          Completion Details
        </Typography>
      </Box>
      )}

      <div className="space-y-4">
        {/* Payment Method Section - Only show for completed jobs */}
        {isCompleted && (
        <div className="space-y-2">
          <Label htmlFor="payment-method" className="text-sm font-semibold">
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isProcessing}>
            <SelectTrigger id="payment-method" className="w-full">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent className="z-[1500]">
              {PAYMENT_METHOD_CHOICES.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}

        {/* Image Upload Section - Show for all jobs */}
        {!isCompleted && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon size={18} />
              Job Images
            </Typography>
          </Box>
        )}
        <div className="space-y-2">
          {isCompleted && (
          <Label className="text-sm font-semibold">
            Job Images
          </Label>
          )}
          <p className="text-xs text-gray-500 mb-3">
            Upload photos related to this job.
          </p>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <Label className="text-xs font-medium text-gray-600 mb-2 block">
                Existing Images ({existingImages.length})
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={image.image_url || image.image}
                      alt={image.caption || "Job image"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E"
                      }}
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                        {image.caption}
                      </div>
                    )}
                    {/* Delete Button */}
                    <div
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!isDeletingImage && !isProcessing) {
                            handleDeleteExistingImage(image.id)
                          }
                        }}
                        className="p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        disabled={isDeletingImage || isProcessing}
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload Area */}
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "flex flex-col items-center justify-center gap-2",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="p-2 rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Click to upload images
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={isProcessing}
            />
          </div>

          {/* New Image Preview Grid */}
          {newImages.length > 0 && (
            <div className="mt-4">
              <Label className="text-xs font-medium text-gray-600 mb-2 block">
                New Images ({newImages.length})
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {newImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Upload Status Overlay */}
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    {image.uploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!image.uploading) {
                          removeNewImage(image.id)
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={image.uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Upload Progress Info */}
              <div className="text-xs text-gray-500 mt-2">
                {newImages.filter(img => img.uploaded).length} of {newImages.length} images uploaded
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog 
        open={deleteImageDialogOpen} 
        onOpenChange={(open) => {
          if (!isDeletingImage) {
            setDeleteImageDialogOpen(open)
            if (!open) {
              setImageToDelete(null)
            }
          }
        }}
      >
        <AlertDialogContent
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside during delete
            if (isDeletingImage) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with escape during delete
            if (isDeletingImage) {
              e.preventDefault()
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeletingImage}
              onClick={(e) => {
                e?.preventDefault?.()
                e?.stopPropagation?.()
                if (!isDeletingImage) {
                  setDeleteImageDialogOpen(false)
                  setImageToDelete(null)
                }
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e?.preventDefault?.()
                e?.stopPropagation?.()
                if (!isDeletingImage) {
                  confirmDeleteImage(e)
                }
              }}
              disabled={isDeletingImage}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingImage ? (
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  )
}

