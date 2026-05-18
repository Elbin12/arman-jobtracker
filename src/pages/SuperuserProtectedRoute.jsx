import { Navigate, useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { ADMIN_HOME_PATH } from "../components/admin/LocationScopedManagementGuard"

/**
 * Restricts a route to users with `is_superuser` from the admin login payload.
 */
const SuperuserProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  const [searchParams] = useSearchParams()

  if (!user?.is_superuser) {
    const search = searchParams.toString()
    return (
      <Navigate
        to={{ pathname: ADMIN_HOME_PATH, search: search ? `?${search}` : "" }}
        replace
      />
    )
  }

  return children
}

export default SuperuserProtectedRoute
