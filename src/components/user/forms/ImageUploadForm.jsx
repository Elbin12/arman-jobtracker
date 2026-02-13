"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useUploadSubmissionImageMutation, useDeleteSubmissionImageMutation, useUpdateSubmissionImageMutation, useReplaceSubmissionImageMutation } from "../../../store/api/user/quoteApi"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Edit2, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@mui/material"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export function ImageUploadForm({ submissionId, quotedBy, quoteDetails, onQuoteDetailsUpdate }) {
  const [localImages, setLocalImages] = useState([])
  const [editingCaption, setEditingCaption] = useState(null)
  const [replacingImage, setReplacingImage] = useState(null)
  const [captionValue, setCaptionValue] = useState("")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [deletedImageIds, setDeletedImageIds] = useState(new Set()) // Track optimistically deleted images
  const [replacedImageUrls, setReplacedImageUrls] = useState(new Map()) // Track optimistically replaced images: imageId -> preview URL
  const [newlyUploadedImages, setNewlyUploadedImages] = useState(new Map()) // Track optimistically uploaded images: imageId -> image object
  const fileInputRef = useRef(null)
  const replaceImageInputRef = useRef(null)
  const { toast } = useToast()
  
  const [uploadSubmissionImage] = useUploadSubmissionImageMutation()
  const [deleteSubmissionImage] = useDeleteSubmissionImageMutation()
  const [updateSubmissionImage] = useUpdateSubmissionImageMutation()
  const [replaceSubmissionImage] = useReplaceSubmissionImageMutation()
  
  // Get images from quoteDetails and filter out optimistically deleted ones
  // Also merge in newly uploaded images that haven't appeared in quoteDetails yet
  const existingImagesFromAPI = (quoteDetails?.images || []).filter(img => !deletedImageIds.has(img.id))
  const existingImages = [
    ...existingImagesFromAPI,
    ...Array.from(newlyUploadedImages.values()).filter(img => 
      // Exclude if already in API response (to avoid duplicates)
      !existingImagesFromAPI.some(apiImg => apiImg.id === img.id) &&
      // Exclude if optimistically deleted
      !deletedImageIds.has(img.id)
    )
  ]
  
  // Sync deletedImageIds, replacedImageUrls, and newlyUploadedImages with quoteDetails
  useEffect(() => {
    if (quoteDetails?.images) {
      const currentImageIds = new Set(quoteDetails.images.map(img => img.id))
      
      // Sync deletedImageIds - remove IDs from deleted set if they're back in the API response
      setDeletedImageIds(prev => {
        const updated = new Set(prev)
        prev.forEach(id => {
          if (currentImageIds.has(id)) {
            updated.delete(id)
          }
        })
        return updated
      })
      
      // Clean up newlyUploadedImages - remove images that now appear in quoteDetails
      setNewlyUploadedImages(prev => {
        const updated = new Map(prev)
        prev.forEach((img, imageId) => {
          if (currentImageIds.has(imageId)) {
            // Image is now in quoteDetails, remove from optimistic cache
            updated.delete(imageId)
          }
        })
        return updated
      })
      
      // Sync replacedImageUrls - always prefer API URLs over preview URLs
      setReplacedImageUrls(prev => {
        const updated = new Map(prev)
        quoteDetails.images.forEach(img => {
          const imageId = img.id
          const apiImageUrl = img.ghl_file_url || img.image_url || img.image
          
          if (updated.has(imageId)) {
            const currentUrl = updated.get(imageId)
            const isPreviewUrl = currentUrl && currentUrl.startsWith('blob:')
            
            // If we have an API URL, always use it (even if we have a preview)
            if (apiImageUrl) {
              // If current URL is a preview blob URL, revoke it
              if (isPreviewUrl) {
                URL.revokeObjectURL(currentUrl)
              }
              // Update with API URL (even if same, to ensure consistency)
              updated.set(imageId, apiImageUrl)
            }
            // If no API URL but we have a preview, keep the preview
            // (This handles edge cases where API response is delayed)
          } else if (apiImageUrl) {
            // Image wasn't in replaced map but exists in API - this shouldn't happen
            // but if it does, we don't need to track it
          }
        })
        
        // Remove entries for images that no longer exist in API response
        const currentImageIds = new Set(quoteDetails.images.map(img => img.id))
        updated.forEach((url, imageId) => {
          if (!currentImageIds.has(imageId)) {
            // Image was deleted - clean up blob URL if it's a preview
            if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url)
            }
            updated.delete(imageId)
          }
        })
        
        return updated
      })
    }
  }, [quoteDetails?.images])
  
  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up all blob URLs when component unmounts
      replacedImageUrls.forEach((url) => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Allow uploads - backend will handle authorization
  
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const validFiles = []
    const invalidFiles = []
    
    files.forEach(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} - Invalid file type`)
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} - File too large (max 10MB)`)
      } else {
        validFiles.push(file)
      }
    })
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: invalidFiles.join(", "),
        variant: "destructive",
      })
    }
    
    const newImages = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false,
      caption: "",
    }))
    
    setLocalImages(prev => [...prev, ...newImages])
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const removeLocalImage = (imageId) => {
    setLocalImages(prev => {
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
    if (!submissionId || !image.file) return
    
    const formData = new FormData()
    formData.append('submission', submissionId)
    formData.append('image', image.file)
    if (image.caption) {
      formData.append('caption', image.caption)
    }
    
    setLocalImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, uploading: true } : img
    ))
    
    try {
      const result = await uploadSubmissionImage(formData).unwrap()
      
      // Handle response - API returns image object with id, image_url, etc.
      // Extract the actual data if wrapped
      const imageData = result?.id ? result : (result?.data || result)
      const serverId = imageData?.id
      
      // Clean up preview URL before removing from localImages
      if (image.preview) {
        URL.revokeObjectURL(image.preview)
      }
      
      // Add to optimistically uploaded images immediately so it shows in "Uploaded Images"
      if (imageData && serverId) {
        // Format the image data to match the expected structure
        // Use the actual API response fields, preserving nulls if they exist
        const uploadedImageData = {
          id: serverId,
          ghl_file_url: imageData.ghl_file_url || null,
          image_url: imageData.image_url || null,
          image: imageData.image || null,
          caption: imageData.caption || image.caption || null,
          submission: imageData.submission || submissionId,
          submission_id: imageData.submission_id || imageData.submission || submissionId,
          created_at: imageData.created_at,
          updated_at: imageData.updated_at,
          uploaded_by: imageData.uploaded_by,
          uploaded_by_name: imageData.uploaded_by_name,
        }
        
        setNewlyUploadedImages(prev => {
          const updated = new Map(prev)
          updated.set(serverId, uploadedImageData)
          return updated
        })
      }
      
      // Remove image from localImages after successful upload
      // It will appear in "Uploaded Images" immediately via optimistic update
      setLocalImages(prev => {
        const updated = prev.filter(img => img.id !== image.id)
        return updated
      })
      
      // Clean up upload progress
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[image.id]
        return newProgress
      })
      
      // Refresh quote details to get updated image list
      // Note: RTK Query will auto-refetch due to invalidatesTags, but we call this for immediate update
      if (onQuoteDetailsUpdate) {
        try {
          await onQuoteDetailsUpdate()
        } catch (refetchError) {
          // Query might not be active yet - that's okay, tag invalidation will handle it
          console.warn('Could not refetch quote details:', refetchError?.message)
        }
      }
      
      toast({
        title: "Upload Successful",
        description: `${image.file.name} uploaded successfully.`,
        variant: "default",
      })
    } catch (error) {
      console.error('Upload error:', error)
      
      // Extract error message from various possible error formats
      let errorMessage = `Failed to upload ${image.file.name}.`
      
      if (error?.data) {
        errorMessage = error.data.message || 
                      error.data.detail || 
                      error.data.error || 
                      errorMessage
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      // Only show error toast if it's a real error (not just unexpected format)
      const isRealError = error?.status === 'FETCH_ERROR' || 
                         error?.status === 'PARSING_ERROR' ||
                         (error?.data && (error.data.message || error.data.detail || error.data.error)) ||
                         (error?.status >= 400 && error?.status < 600)
      
      if (isRealError) {
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        })
        
        setLocalImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, uploading: false, uploaded: false } : img
        ))
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[image.id]
          return newProgress
        })
      } else {
        // Unexpected format but might be success - refresh and remove from localImages
        console.warn('Unexpected response format, treating as success:', error)
        
        // Clean up preview URL before removing from localImages
        if (image.preview) {
          URL.revokeObjectURL(image.preview)
        }
        
        // Remove image from localImages after successful upload
        setLocalImages(prev => {
          const updated = prev.filter(img => img.id !== image.id)
          return updated
        })
        
        // Clean up upload progress
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[image.id]
          return newProgress
        })
        
        // Note: RTK Query will auto-refetch due to invalidatesTags, but we call this for immediate update
        if (onQuoteDetailsUpdate) {
          try {
            await onQuoteDetailsUpdate()
          } catch (refetchError) {
            // Query might not be active yet - that's okay, tag invalidation will handle it
            console.warn('Could not refetch quote details:', refetchError?.message)
          }
        }
        
        toast({
          title: "Upload Successful",
          description: `${image.file.name} uploaded successfully.`,
          variant: "default",
        })
      }
    }
  }
  
  const handleUploadAll = async () => {
    if (localImages.length === 0) return
    
    setUploadingImages(true)
    const errors = []
    
    for (const image of localImages) {
      if (image.file && !image.uploaded) {
        try {
          await uploadImage(image)
        } catch (error) {
          errors.push(`Failed to upload ${image.file.name}`)
        }
      }
    }
    
    setUploadingImages(false)
  }
  
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return
    }
    
    // Optimistically remove the image from UI immediately
    setDeletedImageIds(prev => new Set(prev).add(imageId))
    
    // Also remove from newlyUploadedImages if it's there (for newly added images)
    setNewlyUploadedImages(prev => {
      const updated = new Map(prev)
      if (updated.has(imageId)) {
        updated.delete(imageId)
      }
      return updated
    })
    
    try {
      const result = await deleteSubmissionImage(imageId).unwrap()
      
      // Delete endpoint may return empty response (204) or success object
      // Both are valid success cases
      // Note: RTK Query will auto-refetch due to invalidatesTags, but we call this for immediate update
      if (onQuoteDetailsUpdate) {
        try {
          await onQuoteDetailsUpdate()
        } catch (refetchError) {
          // Query might not be active yet - that's okay, tag invalidation will handle it
          console.warn('Could not refetch quote details:', refetchError?.message)
        }
      }
      
      toast({
        title: "Image Deleted",
        description: "Image has been deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error('Delete error:', error)
      
      // Revert optimistic update on error
      setDeletedImageIds(prev => {
        const updated = new Set(prev)
        updated.delete(imageId)
        return updated
      })
      
      const errorMessage = error?.data?.message || 
                          error?.data?.detail || 
                          error?.message || 
                          "Failed to delete image. Please try again."
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }
  
  const handleReplaceImage = (image) => {
    setReplacingImage(image.id)
    replaceImageInputRef.current?.click()
  }
  
  const handleReplaceImageFile = async (e, imageId) => {
    const file = e.target.files?.[0]
    if (!file) {
      setReplacingImage(null)
      return
    }
    
    // Find the existing image to preserve its caption
    const existingImage = existingImages.find(img => img.id === imageId)
    
    // Validate file
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file (PNG, JPG, GIF, WEBP).",
        variant: "destructive",
      })
      setReplacingImage(null)
      return
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      })
      setReplacingImage(null)
      return
    }
    
    // Create preview URL immediately for optimistic update
    const previewUrl = URL.createObjectURL(file)
    setReplacedImageUrls(prev => new Map(prev).set(imageId, previewUrl))
    
    try {
      const formData = new FormData()
      formData.append('submission', submissionId)
      formData.append('image', file)
      // Preserve existing caption if it exists
      if (existingImage?.caption) {
        formData.append('caption', existingImage.caption)
      }
      
      const result = await replaceSubmissionImage({ imageId, formData }).unwrap()
      
      // Handle both response formats: direct object or wrapped in success
      const imageData = result?.id ? result : (result?.data || result)
      
      // If API returns new image URL, use it instead of preview
      const newImageUrl = imageData?.ghl_file_url || imageData?.image_url || imageData?.image
      if (newImageUrl) {
        // Revoke the preview URL since we have the real URL now
        URL.revokeObjectURL(previewUrl)
        setReplacedImageUrls(prev => {
          const updated = new Map(prev)
          updated.set(imageId, newImageUrl)
          return updated
        })
      }
      
      // Validate response - if it has id or success, it's valid
      if (!imageData || (!imageData.id && !imageData.success && imageData !== result)) {
        // If result is the same as imageData and has no error, consider it success
        // (some APIs return empty object or minimal response)
        console.warn('Replace response may be unexpected:', result)
      }
      
      // Note: RTK Query will auto-refetch due to invalidatesTags, but we call this for immediate update
      if (onQuoteDetailsUpdate) {
        try {
          await onQuoteDetailsUpdate()
        } catch (refetchError) {
          // Query might not be active yet - that's okay, tag invalidation will handle it
          console.warn('Could not refetch quote details:', refetchError?.message)
        }
      }
      
      toast({
        title: "Image Replaced",
        description: "Image has been replaced successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error('Replace error:', error)
      
      // Revert optimistic update on error - remove preview URL
      URL.revokeObjectURL(previewUrl)
      setReplacedImageUrls(prev => {
        const updated = new Map(prev)
        updated.delete(imageId)
        return updated
      })
      
      const errorMessage = error?.data?.message || 
                          error?.data?.detail || 
                          error?.message || 
                          "Failed to replace image. Please try again."
      
      toast({
        title: "Replace Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setReplacingImage(null)
      if (replaceImageInputRef.current) {
        replaceImageInputRef.current.value = ''
      }
    }
  }
  
  const handleUpdateCaption = async (imageId) => {
    try {
      const result = await updateSubmissionImage({ imageId, caption: captionValue }).unwrap()
      
      // Validate response
      if (result && (result.error || (result.data && result.data.error))) {
        throw new Error(result.error || result.data?.error || 'Update failed')
      }
      
      // Note: RTK Query will auto-refetch due to invalidatesTags, but we call this for immediate update
      if (onQuoteDetailsUpdate) {
        try {
          await onQuoteDetailsUpdate()
        } catch (refetchError) {
          // Query might not be active yet - that's okay, tag invalidation will handle it
          console.warn('Could not refetch quote details:', refetchError?.message)
        }
      }
      setEditingCaption(null)
      setCaptionValue("")
      toast({
        title: "Caption Updated",
        description: "Image caption has been updated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error('Update caption error:', error)
      const errorMessage = error?.data?.message || 
                          error?.data?.detail || 
                          error?.message || 
                          "Failed to update caption. Please try again."
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }
  
  const startEditingCaption = (image) => {
    setEditingCaption(image.id)
    setCaptionValue(image.caption || "")
  }
  
  const cancelEditing = () => {
    setEditingCaption(null)
    setCaptionValue("")
  }
  
  // Show message if submission ID is not available
  if (!submissionId) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <ImageIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submission Required</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Please complete the previous steps to create a submission before uploading images.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Images</h2>
        <p className="text-gray-600">
          Upload images related to this quote submission. Images help provide context and documentation.
        </p>
      </div>
      
      {/* Upload Area */}
      <div className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200",
            "hover:border-blue-500 hover:bg-blue-50/50",
            "flex flex-col items-center justify-center gap-3",
            "bg-white"
          )}
        >
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF, WEBP up to 10MB
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={replaceImageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (replacingImage) {
              handleReplaceImageFile(e, replacingImage)
            }
          }}
          className="hidden"
        />
      </div>
      
      {/* Local Images Preview (Before Upload) */}
      {localImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Images ({localImages.filter(img => !img.uploaded).length})
            </h3>
            <Button
              onClick={handleUploadAll}
              disabled={uploadingImages || localImages.every(img => img.uploaded)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {localImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative">
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  
                  {image.uploaded && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  )}
                  
                  {!image.uploaded && !image.uploading && (
                    <button
                      onClick={() => removeLocalImage(image.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* {!image.uploaded && (
                  <input
                    type="text"
                    placeholder="Add caption (optional)"
                    value={image.caption || ""}
                    onChange={(e) => {
                      setLocalImages(prev => prev.map(img =>
                        img.id === image.id ? { ...img, caption: e.target.value } : img
                      ))
                    }}
                    className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )} */}
                
                {uploadProgress[image.id] && uploadProgress[image.id] < 100 && (
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress[image.id]}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Uploaded Images ({existingImages.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative">
                  {replacingImage === image.id ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  ) : null}
                  {(() => {
                    // Check if this image was replaced optimistically - use replaced URL first
                    const replacedUrl = replacedImageUrls.get(image.id)
                    
                    // Prioritize replaced URL, then ghl_file_url, then image_url, then image
                    const imageSrc = replacedUrl || image.ghl_file_url || image.image_url || image.image
                    
                    if (!imageSrc) {
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-xs text-gray-500">No image URL</span>
                        </div>
                      )
                    }
                    
                    return (
                      <img
                        src={imageSrc}
                        alt={image.caption || "Uploaded image"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if primary image URL fails - try ghl_file_url first, then others
                          if (image.ghl_file_url && e.target.src !== image.ghl_file_url) {
                            e.target.src = image.ghl_file_url
                          } else if (image.image_url && e.target.src !== image.image_url) {
                            e.target.src = image.image_url
                          } else if (image.image && e.target.src !== image.image) {
                            e.target.src = image.image
                          } else {
                            e.target.style.display = 'none'
                            console.error('Failed to load image:', image.id, 'URLs:', {
                              replacedUrl,
                              ghl_file_url: image.ghl_file_url,
                              image_url: image.image_url,
                              image: image.image
                            })
                          }
                        }}
                      />
                    )
                  })()}
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {/* <button
                      onClick={() => handleReplaceImage(image)}
                      className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                      title="Replace image"
                      disabled={replacingImage === image.id}
                    >
                      <RefreshCw className="h-4 w-4 text-white" />
                    </button> */}
                    {/* <button
                      onClick={() => startEditingCaption(image)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Edit caption"
                    >
                      <Edit2 className="h-4 w-4 text-gray-700" />
                    </button> */}
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                
                {editingCaption === image.id ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={captionValue}
                      onChange={(e) => setCaptionValue(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter caption"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCaption(image.id)}
                        className="h-6 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        className="h-6 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  image.caption && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{image.caption}</p>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {existingImages.length === 0 && localImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No images uploaded yet. Click above to add images.</p>
        </div>
      )}
    </div>
  )
}

export default ImageUploadForm
