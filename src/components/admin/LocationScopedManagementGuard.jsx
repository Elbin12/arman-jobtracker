"use client"

import { useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

/** Management routes hidden when `?location_id=` is present (location-scoped admin session). */
export const ADMIN_MANAGEMENT_PATHS = [
  "/admin/services",
  "/admin/locations",
  "/admin/subaccounts",
  "/admin/house-size-info",
]

export const ADMIN_HOME_PATH = "/admin/jobs"

/**
 * Redirects away from company-wide management pages when `location_id` is in the query string.
 */
export default function LocationScopedManagementGuard({ children }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const location_id = searchParams.get("location_id")

  const isManagementPath = ADMIN_MANAGEMENT_PATHS.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  )

  useEffect(() => {
    if (!location_id || !isManagementPath) return
    const search = searchParams.toString()
    navigate(
      { pathname: ADMIN_HOME_PATH, search: search ? `?${search}` : "" },
      { replace: true }
    )
  }, [location_id, isManagementPath, navigate, searchParams])

  if (location_id && isManagementPath) {
    return null
  }

  return children
}
