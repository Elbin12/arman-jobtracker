"use client"

import { useState, useRef } from "react"
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
  const fileInputRef = useRef(null)
  const replaceImageInputRef = useRef(null)
  const { toast } = useToast()
  
  const [uploadSubmissionImage] = useUploadSubmissionImageMutation()
  const [deleteSubmissionImage] = useDeleteSubmissionImageMutation()
  const [updateSubmissionImage] = useUpdateSubmissionImageMutation()
  const [replaceSubmissionImage] = useReplaceSubmissionImageMutation()
  
  // Get images from quoteDetails instead of separate API call
  const existingImages = quoteDetails?.images || []
  
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
      setLocalImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploaded: true, uploading: false, serverId: result.id } : img
      ))
      setUploadProgress(prev => ({ ...prev, [image.id]: 100 }))
      if (onQuoteDetailsUpdate) {
        await onQuoteDetailsUpdate()
      }
      toast({
        title: "Upload Successful",
        description: `${image.file.name} uploaded successfully.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error?.data?.message || error?.data?.detail || `Failed to upload ${image.file.name}. Please try again.`,
        variant: "destructive",
      })
      setLocalImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploading: false } : img
      ))
      throw error
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
    
    if (errors.length > 0) {
      toast({
        title: "Some uploads failed",
        description: errors.join(", "),
        variant: "destructive",
      })
    } else if (localImages.length > 0) {
      // Clear successfully uploaded images after a delay
      setTimeout(() => {
        setLocalImages(prev => prev.filter(img => !img.uploaded))
      }, 1000)
    }
  }
  
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return
    }
    
    try {
      await deleteSubmissionImage(imageId).unwrap()
      if (onQuoteDetailsUpdate) {
        await onQuoteDetailsUpdate()
      }
      toast({
        title: "Image Deleted",
        description: "Image has been deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error?.data?.message || error?.data?.detail || "Failed to delete image. Please try again.",
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
    
    try {
      const formData = new FormData()
      formData.append('submission', submissionId)
      formData.append('image', file)
      // Preserve existing caption if it exists
      if (existingImage?.caption) {
        formData.append('caption', existingImage.caption)
      }
      
      await replaceSubmissionImage({ imageId, formData }).unwrap()
      
      if (onQuoteDetailsUpdate) {
        await onQuoteDetailsUpdate()
      }
      
      toast({
        title: "Image Replaced",
        description: "Image has been replaced successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Replace Failed",
        description: error?.data?.message || error?.data?.detail || "Failed to replace image. Please try again.",
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
      await updateSubmissionImage({ imageId, caption: captionValue }).unwrap()
      if (onQuoteDetailsUpdate) {
        await onQuoteDetailsUpdate()
      }
      setEditingCaption(null)
      setCaptionValue("")
      toast({
        title: "Caption Updated",
        description: "Image caption has been updated successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error?.data?.message || error?.data?.detail || "Failed to update caption. Please try again.",
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
                
                {!image.uploaded && (
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
                )}
                
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
                  <img
                    src={image.image || image.image_url}
                    alt={image.caption || "Uploaded image"}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleReplaceImage(image)}
                      className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                      title="Replace image"
                      disabled={replacingImage === image.id}
                    >
                      <RefreshCw className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => startEditingCaption(image)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Edit caption"
                    >
                      <Edit2 className="h-4 w-4 text-gray-700" />
                    </button>
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
