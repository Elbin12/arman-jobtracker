/**
 * Z-Index Scale System
 * 
 * Standardized z-index values to prevent conflicts and ensure proper layering
 * 
 * Usage:
 * import { zIndex } from '@/lib/z-index';
 * 
 * sx={{ zIndex: zIndex.dropdown }}
 */

export const zIndex = {
  // Base layers
  base: 0,
  
  // Content layers
  content: 1,
  sticky: 10,
  
  // Overlay layers
  overlay: 100,
  backdrop: 200,
  
  // Navigation
  nav: 1000,
  navDropdown: 1100,
  
  // Modals and dialogs
  modal: 1200,
  modalBackdrop: 1199,
  modalContent: 1201,
  
  // Dropdowns and popovers
  dropdown: 1300,
  popover: 1300,
  tooltip: 1400,
  
  // Toast notifications
  toast: 1500,
  
  // Maximum (use sparingly)
  max: 9999,
} as const;

export type ZIndexKey = keyof typeof zIndex;















