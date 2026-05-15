"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Alert,
  Link,
  InputAdornment,
  Switch,
} from "@mui/material"
import { AccountTree, Link as LinkIcon, Search } from "@mui/icons-material"
import {
  useListGHLLocationsQuery,
  useToggleGHLLocationActiveMutation,
  usePostGHLLocationOnboardMutation,
} from "../../store/api/ghlLocationsApi"
import { TableSkeleton } from "../../components/ui/skeletons"

/**
 * After `await`, `window.open(about:blank)` + assigning `location` often fails (COOP / opaque
 * window proxies). A real `<a target="_blank">` click usually still counts as user-initiated.
 */
function openOAuthUrlInNewTab(url) {
  const a = document.createElement("a")
  a.href = url
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  a.referrerPolicy = "no-referrer"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function pickAuthUrl(body) {
  if (body == null) return ""
  if (typeof body === "string") return ""
  if (typeof body === "object" && typeof body.auth_url === "string") return body.auth_url
  if (typeof body === "object" && body.data && typeof body.data.auth_url === "string") {
    return body.data.auth_url
  }
  return ""
}

const SubaccountsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const listArg = useMemo(() => (search ? { search } : {}), [search])
  const { data: locationsListData, isLoading, error, refetch } = useListGHLLocationsQuery(listArg)
  const ghlLocations = locationsListData?.results ?? locationsListData ?? []

  const [toggleGHLLocationActive] = useToggleGHLLocationActiveMutation()
  const [postGHLLocationOnboard, { isLoading: isOnboarding }] = usePostGHLLocationOnboardMutation()

  const [toggleBusyId, setToggleBusyId] = useState(null)
  const [onboardError, setOnboardError] = useState(null)
  /** Shown if automatic new-tab open may have been blocked; user can tap the link. */
  const [oauthHandoffUrl, setOauthHandoffUrl] = useState(null)

  const connectedSuccess = searchParams.get("connected") === "1"

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const handleOnboardSubaccount = async () => {
    setOnboardError(null)
    setOauthHandoffUrl(null)
    try {
      const body = await postGHLLocationOnboard().unwrap()
      const auth_url = pickAuthUrl(body)
      if (!auth_url) {
        setOnboardError("Server did not return an OAuth URL.")
        return
      }
      openOAuthUrlInNewTab(auth_url)
      setOauthHandoffUrl(auth_url)
    } catch (err) {
      setOnboardError(err?.data?.detail || err?.message || "Failed to start GHL onboarding")
    }
  }

  const dismissConnectedBanner = () => {
    searchParams.delete("connected")
    setSearchParams(searchParams, { replace: true })
    refetch()
  }

  const handleToggleActive = async (item) => {
    setToggleBusyId(item.id)
    try {
      await toggleGHLLocationActive(item.id).unwrap()
    } catch {
      // error surfaced via RTK / toast elsewhere if wired
    } finally {
      setToggleBusyId(null)
    }
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">
          Error loading GHL locations: {error?.data?.detail || error.message || "Unknown error"}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {connectedSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={dismissConnectedBanner}>
          GHL subaccount connected successfully.
        </Alert>
      )}

      {onboardError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOnboardError(null)}>
          {onboardError}
        </Alert>
      )}

      {oauthHandoffUrl && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          onClose={() => setOauthHandoffUrl(null)}
        >
          If a new tab did not open (popup blocker),{" "}
          <Link href={oauthHandoffUrl} target="_blank" rel="noopener noreferrer">
            open GoHighLevel here
          </Link>
          .
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Subaccount Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Onboard GHL subaccounts and manage synced locations for your company
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<LinkIcon />}
          onClick={handleOnboardSubaccount}
          disabled={isOnboarding}
        >
          {isOnboarding ? "Opening…" : "Onboard Subaccount"}
        </Button>
      </Box>

      <Box component="form" onSubmit={handleSearchSubmit} mb={3}>
        <TextField
          size="small"
          placeholder="Search by id, name, address, city, email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" sx={{ ml: 1 }}>
          Search
        </Button>
        {search && (
          <Button
            sx={{ ml: 1 }}
            onClick={() => {
              setSearch("")
              setSearchInput("")
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Card>
          <CardContent>
            <TableSkeleton rows={6} columns={8} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Location ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>City / State</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Timezone</TableCell>
                    <TableCell align="center">Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ghlLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary" py={3}>
                          No GHL locations yet. Run pull_ghl_locations or onboard a subaccount.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ghlLocations.map((item) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          opacity: item.is_active === false ? 0.55 : 1,
                        }}
                      >
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                            {item.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <AccountTree color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle2" fontWeight="bold">
                              {item.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {[item.city, item.state].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell>{item.country || "—"}</TableCell>
                        <TableCell>
                          <Typography variant="caption">{item.company_id || "—"}</Typography>
                        </TableCell>
                        <TableCell>{item.email || "—"}</TableCell>
                        <TableCell>{item.timezone || "—"}</TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={item.is_active !== false}
                            onChange={() => handleToggleActive(item)}
                            disabled={toggleBusyId === item.id}
                            color="success"
                            inputProps={{ "aria-label": `Active ${item.name}` }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default SubaccountsManagement
