import React from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from './store/index.js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Import pages
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import { AdminLayout } from './components/layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ServicesManagement from './pages/admin/ServicesManagement.jsx';
import LocationsManagement from './pages/admin/LocationsManagement.jsx';
import { BookingWizard } from './components/user/BookingWizard.jsx';
import UserLogin from './pages/admin/userLogin.jsx';
import AdminProtectedRoute from './pages/AdminProtectedRoute.jsx';
import QuoteDetailsPage from './pages/user/QuoteDetailsPage.jsx';
import HouseSizeInfo from './components/admin/HouseSizeInfo.jsx';
import { PersistGate } from 'redux-persist/integration/react';
import TermsAndConditions from './pages/user/TermsAndConditions.jsx';
import Jobs from './pages/admin/Jobs.jsx';
import AdminCalendar from './pages/admin/AdminCalendar.jsx';
import TeamManagement from './pages/admin/TeamManagement.jsx';
import AcceptedQuotes from './pages/admin/AcceptedQuotes.jsx';
import CreateJob from './pages/admin/CreateJob.jsx';
import RoleProtectedRoute from './pages/RoleProtectedRoute.jsx';
import TimeClock from './pages/admin/payroll/TimeClock.jsx';
import PayrollCalculator from './pages/admin/payroll/PayrollCalculator.jsx';
import PayrollReports from './pages/admin/payroll/PayrollReports.jsx';
import PayrollSettings from './pages/admin/payroll/PayrollSettings.jsx';
import PayrollTeamManagement from './pages/admin/payroll/PayrollTeamManagement.jsx';

// Create Material-UI theme that integrates with our design system
const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(224, 76%, 48%)',
    },
    secondary: {
      main: 'hsl(259, 70%, 55%)',
    },
    background: {
      default: 'hsl(0, 0%, 100%)',
      paper: 'hsl(0, 0%, 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Navigate to="/booking" replace />} />
                  <Route path="/booking" element={<BookingWizard />} />
                  <Route path="/quote/details/:id" element={<QuoteDetailsPage />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  
                  {/* Admin Login Route */}
                  <Route path="/admin/login" element={<UserLogin />} />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/admin" element={
                    <AdminProtectedRoute >
                      <AdminLayout userRole="worker">
                        <Outlet />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="jobs" element={<Jobs />} />
                    {/* <Route path="jobs/:id" element={<JobDetails />} /> */}
                    <Route path="accepted-quotes" element={
                        <RoleProtectedRoute allowedRoles={['manager']}>
                          <AcceptedQuotes />
                        </RoleProtectedRoute>
                      }
                      />
                    <Route path="team" element={
                        <RoleProtectedRoute allowedRoles={['manager']}>
                          <TeamManagement />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route path="calendar" element={<AdminCalendar />} />
                    <Route path="create-job" element={
                        <RoleProtectedRoute allowedRoles={['manager']}>
                          <CreateJob />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route path="services" element={
                        <RoleProtectedRoute allowedRoles={['manager']}>
                          <ServicesManagement />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route path="locations" element={
                        <RoleProtectedRoute allowedRoles={['manager']}>
                          <LocationsManagement />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route path="house-size-info" element={
                        <RoleProtectedRoute allowedRoles={['manager']}>
                          <HouseSizeInfo />
                        </RoleProtectedRoute>
                      }
                    />
                    
                    {/* Payroll Routes */}
                    <Route path="payroll" element={<TimeClock />} />
                    <Route path="payroll/calculator" element={<PayrollCalculator />} />
                    <Route path="payroll/reports" element={<PayrollReports />} />
                    <Route path="payroll/settings" element={
                        <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                          <PayrollSettings />
                        </RoleProtectedRoute>
                      }
                    />
                    {/* <Route path="payroll/team" element={
                        <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                          <PayrollTeamManagement />
                        </RoleProtectedRoute>
                      }
                    /> */}
                  </Route>
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;