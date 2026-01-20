"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUploadJobImageMutation, useUpdateJobPaymentMethodMutation } from "@/store/api/jobsApi"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const PAYMENT_METHOD_CHOICES = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'check', label: 'Check' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online_payment', label: 'Online Payment' },
  { value: 'other', label: 'Other' },
]

export function JobCompletionForm({ job, onComplete, onCancel, isSubmitting = false }) {
  const [images, setImages] = useState([])
  const [paymentMethod, setPaymentMethod] = useState("")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRef = useRef(null)
  const { toast } = useToast()
  
  const [uploadJobImage] = useUploadJobImageMutation()
  const [updatePaymentMethod] = useUpdateJobPaymentMethodMutation()

  const jobId = job?.job_id || job?.id

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false,
    }))
    setImages(prev => [...prev, ...newImages])
    
    // Clear the file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  const removeImage = (imageId) => {
    setImages(prev => {
      const image = prev.find(img => img.id === imageId)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== imageId)
    })
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[imageId]
      return newProgress
    })
  }

  const uploadImage = async (image) => {
    if (!jobId || !image.file) return

    const formData = new FormData()
    formData.append('job', jobId)
    formData.append('image', image.file)

    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, uploading: true } : img
    ))

    try {
      await uploadJobImage(formData).unwrap()
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploaded: true, uploading: false } : img
      ))
      setUploadProgress(prev => ({ ...prev, [image.id]: 100 }))
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error?.data?.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploading: false } : img
      ))
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method before completing the job.",
        variant: "destructive",
      })
      return
    }

    setUploadingImages(true)
    const errors = []

    // Upload all images when user clicks Complete Job
    for (const image of images) {
      if (image.file) {
        try {
          await uploadImage(image)
        } catch (error) {
          errors.push(`Failed to upload ${image.file.name}`)
        }
      }
    }

    // Update payment method
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
      setUploadingImages(false)
      return
    }

    setUploadingImages(false)

    if (errors.length > 0) {
      toast({
        title: "Some operations failed",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }

    // All uploads and payment method update successful
    // Now trigger the status update via onComplete
    if (onComplete) {
      onComplete()
    }
  }

  // Allow submission if payment method is selected and not currently submitting
  const canSubmit = paymentMethod && !uploadingImages && !isSubmitting

  return (
    <div className="space-y-6">
      {/* Payment Method Section */}
      <div className="space-y-2">
        <Label htmlFor="payment-method" className="text-sm font-semibold text-gray-900">
          Payment Method <span className="text-red-500">*</span>
        </Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
        <p className="text-xs text-gray-500">
          Select how the customer paid for this job.
        </p>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-900">
          Job Images
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Upload photos related to this job completion (optional but recommended).
        </p>

        {/* Image Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            "flex flex-col items-center justify-center gap-2"
          )}
        >
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
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
          />
        </div>

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Upload Status Overlay - only show when uploading during submit */}
                {image.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(image.id)
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  disabled={image.uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Image Count Info */}
        {images.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {images.length} image{images.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || uploadingImages}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || uploadingImages}
          className="min-w-[120px]"
        >
          {uploadingImages ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            "Complete Job"
          )}
        </Button>
      </div>
    </div>
  )
}

