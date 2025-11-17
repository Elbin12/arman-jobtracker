"use client"
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  ListItemIcon,
  Divider,
  Avatar,
  Chip,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material"
import {
  Menu as MenuIcon,
  BusinessCenter,
  LocationOn,
  Logout,
  AdminPanelSettings,
  Person,
  KeyboardArrowDown,
  WorkOutline,
  Event,
  Group,
  ReceiptLong,
  AddCircleOutline,
  Home,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useDispatch } from "react-redux"
import { logoutUser } from "../../store/slices/authSlice"

const navItems = [
  { text: "Dashboard", path: "/admin/dashboard", icon: AdminPanelSettings },
  { text: "Jobs", path: "/admin/jobs", icon: WorkOutline },
  { text: "Quotes", path: "/admin/accepted-quotes", icon: ReceiptLong },
  { text: "Team", path: "/admin/team", icon: Group },
  { text: "Calendar", path: "/admin/calendar", icon: Event },
]

const managementItems = [
  { text: "Service Management", path: "/admin/services", icon: BusinessCenter },
  { text: "Location Management", path: "/admin/locations", icon: LocationOn },
  { text: "House Size Info", path: "/admin/house-size-info", icon: Home },
]

export const AdminLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null)
  const [managementAnchor, setManagementAnchor] = useState(null)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const isManagementActive =
    managementItems.some((item) => location.pathname === item.path) || location.pathname === "/admin/calendar"

  const handleMobileMenuClick = (e) => {
    setMobileMenuAnchor(e.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
    setMobileMoreOpen(false)
  }

  const handleManagementClick = (e) => {
    setManagementAnchor(e.currentTarget)
  }

  const handleManagementClose = () => {
    setManagementAnchor(null)
  }

  const handleUserMenuClick = (e) => {
    setUserMenuAnchor(e.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleNavigate = (path) => {
    navigate(path)
    handleManagementClose()
    handleMobileMenuClose()
  }

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate("/admin/login")
    handleUserMenuClose()
  }

  const handleSwitchToUser = () => {
    navigate("/")
    handleUserMenuClose()
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleMobileMenuClick}
              sx={{ mr: 1, color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 3 }}>
            {/* <AdminPanelSettings sx={{ color: "hsl(var(--primary))", fontSize: 28 }} /> */}
            <img src="/image.png" alt="" className="h-9"/>
            {/* {!isSmallMobile && ( */}
              {/* <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  whiteSpace: "nowrap",
                }}
              >
                Service Booking
              </Typography> */}
            {/* )} */}
          </Box>

          {!isMobile && (
            <>
              <Box sx={{ display: "flex", gap: 0.5, flexGrow: 1 }}>
                {navItems.slice(0, 4).map((item) => (
                  <Button
                    key={item.text}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      color: location.pathname === item.path ? "hsl(var(--primary))" : "text.primary",
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      textTransform: "none",
                      px: 2,
                      borderRadius: 2,
                      position: "relative",
                      "&:hover": {
                        backgroundColor: "hsl(var(--primary) / 0.08)",
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: location.pathname === item.path ? "80%" : "0%",
                        height: "3px",
                        backgroundColor: "hsl(var(--primary))",
                        transition: "width 0.3s ease",
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                ))}

                <Button
                  onClick={handleManagementClick}
                  endIcon={<KeyboardArrowDown />}
                  sx={{
                    color: isManagementActive ? "hsl(var(--primary))" : "text.primary",
                    fontWeight: isManagementActive ? 600 : 500,
                    textTransform: "none",
                    px: 2,
                    borderRadius: 2,
                    position: "relative",
                    "&:hover": {
                      backgroundColor: "hsl(var(--primary) / 0.08)",
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: isManagementActive ? "80%" : "0%",
                      height: "3px",
                      backgroundColor: "hsl(var(--primary))",
                      transition: "width 0.3s ease",
                    },
                  }}
                >
                  More
                </Button>

                <Menu
                  anchorEl={managementAnchor}
                  open={Boolean(managementAnchor)}
                  onClose={handleManagementClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  sx={{
                    mt: 1,
                    "& .MuiPaper-root": {
                      minWidth: 220,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => handleNavigate("/admin/calendar")}
                    selected={location.pathname === "/admin/calendar"}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon>
                      <Event fontSize="small" />
                    </ListItemIcon>
                    Calendar
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      MANAGEMENT
                    </Typography>
                  </Box>
                  {managementItems.map((item) => (
                    <MenuItem
                      key={item.text}
                      onClick={() => handleNavigate(item.path)}
                      selected={location.pathname === item.path}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemIcon>
                        <item.icon fontSize="small" />
                      </ListItemIcon>
                      {item.text}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddCircleOutline />}
                onClick={() => handleNavigate("/admin/create-job")}
                sx={{
                  textTransform: "none",
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                  px: 3,
                  borderRadius: 1,
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "hsl(var(--primary) / 0.9)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  },
                  mr: 1,
                }}
              >
                Create Job
              </Button>
            </>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          <IconButton onClick={handleUserMenuClick} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "hsl(var(--primary))" }}>
              <Person />
            </Avatar>
          </IconButton>

          {/* Mobile Navigation Menu */}
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleMobileMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            sx={{
              mt: 1,
              display: { lg: "none" },
              "& .MuiPaper-root": {
                minWidth: 280,
                maxWidth: "90vw",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ py: 1 }}>
              {navItems.map((item) => (
                <MenuItem
                  key={item.text}
                  onClick={() => handleNavigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    py: 1.5,
                    mx: 1,
                    borderRadius: 1,
                    "&.Mui-selected": {
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? "hsl(var(--primary))" : "inherit" }}>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </MenuItem>
              ))}

              <Divider sx={{ my: 1 }} />

              <ListItemButton
                onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                sx={{ mx: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary="More"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {mobileMoreOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={mobileMoreOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {managementItems.map((item) => (
                    <MenuItem
                      key={item.text}
                      onClick={() => handleNavigate(item.path)}
                      selected={location.pathname === item.path}
                      sx={{
                        py: 1.5,
                        pl: 4,
                        mx: 1,
                        borderRadius: 1,
                        "&.Mui-selected": {
                          backgroundColor: "hsl(var(--primary) / 0.1)",
                          color: "hsl(var(--primary))",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ color: location.pathname === item.path ? "hsl(var(--primary))" : "inherit" }}
                      >
                        <item.icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: "0.9rem" }}
                      />
                    </MenuItem>
                  ))}
                </List>
              </Collapse>

              <Divider sx={{ my: 1 }} />

              <MenuItem
                onClick={() => handleNavigate("/admin/create-job")}
                selected={location.pathname === "/admin/create-job"}
                sx={{
                  py: 1.5,
                  mx: 1,
                  borderRadius: 1,
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "hsl(var(--primary) / 0.9)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "hsl(var(--primary))",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "white" }}>
                  <AddCircleOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Create Job" />
              </MenuItem>
            </Box>
          </Menu>

          {/* User Menu */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            sx={{
              mt: 1,
              "& .MuiPaper-root": {
                minWidth: 200,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Admin User
              </Typography>
              <Chip label="Administrator" size="small" color="primary" sx={{ mt: 0.5, height: 20 }} />
            </Box>
            <MenuItem onClick={handleSwitchToUser} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Switch to User
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: "error.main" }}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          backgroundColor: "hsl(var(--muted) / 0.3)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {children}
      </Box>
    </Box>
  )
}