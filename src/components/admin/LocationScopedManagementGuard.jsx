"use client"

import { useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

export const ADMIN_SUBACCOUNTS_PATH = "/admin/subaccounts"
export const ADMIN_HOME_PATH = "/admin/jobs"

/**
 * Redirects away from subaccount management when `location_id` is in the query string.
 */
export default function LocationScopedManagementGuard({ children }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const location_id = searchParams.get("location_id")

  const isSubaccountsPath =
    location.pathname === ADMIN_SUBACCOUNTS_PATH ||
    location.pathname.startsWith(`${ADMIN_SUBACCOUNTS_PATH}/`)

  useEffect(() => {
    if (!location_id || !isSubaccountsPath) return
    const search = searchParams.toString()
    navigate(
      { pathname: ADMIN_HOME_PATH, search: search ? `?${search}` : "" },
      { replace: true }
    )
  }, [location_id, isSubaccountsPath, navigate, searchParams])

  if (location_id && isSubaccountsPath) {
    return null
  }

  return children
}
