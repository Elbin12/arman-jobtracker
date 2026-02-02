"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Dialog,
  Box,
  IconButton,
  Typography,
} from "@mui/material"
import {
  Close,
  ZoomIn,
  ZoomOut,
  FitScreen,
} from "@mui/icons-material"

/**
 * Reusable Image Viewer Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the viewer is open
 * @param {Function} props.onClose - Callback when viewer is closed
 * @param {Object} props.image - The image object to display { image_url, image, caption, id }
 * @param {number} props.initialZoom - Initial zoom level (default: 1)
 * @param {boolean} props.showCaption - Whether to show caption (default: true)
 * @param {string} props.backdropColor - Backdrop color (default: "rgba(0, 0, 0, 0.7)")
 * @param {number} props.maxZoom - Maximum zoom level (default: 5)
 * @param {number} props.minZoom - Minimum zoom level (default: 0.5)
 */
export const ImageViewer = ({
  open,
  onClose,
  image,
  initialZoom = 1,
  showCaption = true,
  backdropColor = "rgba(0, 0, 0, 0.7)",
  maxZoom = 5,
  minZoom = 0.5,
}) => {
  const [imageZoom, setImageZoom] = useState(initialZoom)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const imageContainerRef = useRef(null)

  // Zoom handlers
  const handleZoomIn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImageZoom((prev) => Math.min(prev + 0.25, maxZoom))
  }

  const handleZoomOut = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImageZoom((prev) => Math.max(prev - 0.25, minZoom))
  }

  const handleResetZoom = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImageZoom(initialZoom)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      }
    }
  }

  const handleMouseMove = useCallback((e) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    }
  }, [isDragging, imageZoom])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Reset zoom when image changes
  useEffect(() => {
    if (open && image) {
      setImageZoom(initialZoom)
      setImagePosition({ x: 0, y: 0 })
    }
  }, [open, image, initialZoom])

  // Add wheel and mouse event listeners
  useEffect(() => {
    if (open && image) {
      // Wheel handler for immediate zoom
      const wheelHandler = (e) => {
        if (open && image) {
          e.preventDefault()
          const delta = e.deltaY > 0 ? -0.1 : 0.1
          setImageZoom((prev) => Math.max(minZoom, Math.min(maxZoom, prev + delta)))
        }
      }
      
      window.addEventListener('wheel', wheelHandler, { passive: false })
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('wheel', wheelHandler)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [open, image, handleMouseMove, minZoom, maxZoom])

  const handleClose = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setImageZoom(initialZoom)
    setImagePosition({ x: 0, y: 0 })
    onClose()
  }
  
  const handleDialogClose = (event, reason) => {
    // Only allow closing via escape key or explicit close button
    // Disable backdrop clicks to prevent accidental closes when clicking controls
    if (reason === 'escapeKeyDown') {
      handleClose()
    }
    // Completely ignore backdrop clicks - user must use close button or ESC
  }
  
  const handleContentClick = (e) => {
    // Stop any clicks inside the content from propagating to backdrop
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleContentMouseDown = (e) => {
    // Stop any mouse down events inside the content from propagating
    e.preventDefault()
    e.stopPropagation()
  }

  if (!image) return null

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth={false}
      disableEscapeKeyDown={false}
      PaperProps={{
        onClick: (e) => {
          // Prevent clicks on Paper from closing dialog
          e.stopPropagation()
        },
        onMouseDown: (e) => {
          // Prevent clicks on Paper from closing dialog
          e.stopPropagation()
        },
        sx: {
          maxWidth: "100vw",
          maxHeight: "100vh",
          width: "100%",
          height: "100%",
          m: 0,
          borderRadius: 0,
          bgcolor: "transparent",
          boxShadow: "none",
        },
      }}
      BackdropProps={{
        onClick: (e) => {
          // Completely prevent backdrop clicks from closing
          // User must use close button or ESC key
          e.preventDefault()
          e.stopPropagation()
        },
        onMouseDown: (e) => {
          e.preventDefault()
          e.stopPropagation()
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          bgcolor: backdropColor,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        },
        "& .MuiDialog-container": {
          "& .MuiPaper-root": {
            pointerEvents: "auto",
          },
        },
      }}
    >
      <Box
        onClick={handleContentClick}
        onMouseDown={handleContentMouseDown}
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 1300,
            bgcolor: "rgba(255, 255, 255, 0.95)",
            color: "#023c8f",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 1)",
              transform: "scale(1.05)",
            },
            width: 48,
            height: 48,
            transition: "all 0.2s ease",
          }}
        >
          <Close sx={{ fontSize: 28 }} />
        </IconButton>

        {/* Zoom Controls */}
        <Box
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 1300,
            display: "flex",
            flexDirection: "row",
            gap: 1,
          }}
        >
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleZoomIn(e)
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            disabled={imageZoom >= maxZoom}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.95)",
              color: "#023c8f",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 1)",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: "rgba(255, 255, 255, 0.5)",
                color: "rgba(2, 60, 143, 0.5)",
              },
              width: 48,
              height: 48,
              transition: "all 0.2s ease",
            }}
            title="Zoom In"
          >
            <ZoomIn sx={{ fontSize: 24 }} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleZoomOut(e)
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            disabled={imageZoom <= minZoom}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.95)",
              color: "#023c8f",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 1)",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: "rgba(255, 255, 255, 0.5)",
                color: "rgba(2, 60, 143, 0.5)",
              },
              width: 48,
              height: 48,
              transition: "all 0.2s ease",
            }}
            title="Zoom Out"
          >
            <ZoomOut sx={{ fontSize: 24 }} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleResetZoom(e)
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            disabled={imageZoom === initialZoom && imagePosition.x === 0 && imagePosition.y === 0}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.95)",
              color: "#023c8f",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 1)",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: "rgba(255, 255, 255, 0.5)",
                color: "rgba(2, 60, 143, 0.5)",
              },
              width: 48,
              height: 48,
              transition: "all 0.2s ease",
            }}
            title="Reset Zoom"
          >
            <FitScreen sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>

        {/* Image Container */}
        <Box
          ref={imageContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            overflow: "hidden",
            cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
        >
          <Box
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.98)",
              borderRadius: 0,
              p: 2,
              boxShadow: "0 12px 48px rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            <img
              src={image.image_url || image.image}
              alt={image.caption || "Image"}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(100vh - 180px)",
                objectFit: "contain",
                borderRadius: 0,
                display: "block",
                transform: `scale(${imageZoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              draggable={false}
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E"
              }}
            />
          </Box>
          {showCaption && image.caption && (
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.95)",
                color: "#023c8f",
                p: 0,
                px: 3,
                py: 0.5,
                borderRadius: 0,
                maxWidth: "80%",
                textAlign: "center",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {image.caption}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}

export default ImageViewer
