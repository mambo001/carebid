import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import { CssBaseline, ThemeProvider } from "@mui/material"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom"

import { IdentityContextProvider, RoomContextProvider } from "./context"
import { AppBar, BottomNavigation, BottomNavigationSkeleton } from "./nav"
import {
  Home,
  HomeSkeleton,
  PatientDashboard,
  ProviderDashboard,
  Room,
  Settings,
} from "./pages"
import { appTheme } from "./theme"

const queryClient = new QueryClient()

const errorBoundaryFallback = <div>Something went wrong</div>

function AppSkeleton() {
  return (
    <Box sx={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>
      <AppBar />
      <HomeSkeleton />
      <BottomNavigationSkeleton />
    </Box>
  )
}

function AppLayout() {
  return (
    <Box sx={{ minHeight: "100svh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <AppBar />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>
      <BottomNavigation />
    </Box>
  )
}

export function AppInternal() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/requests/:requestId" element={<Room />} />
        <Route path="/room/:requestId" element={<Room />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <CssBaseline />
        <ErrorBoundary fallback={errorBoundaryFallback}>
          <Suspense fallback={<AppSkeleton />}>
            <IdentityContextProvider>
              <BrowserRouter>
                <RoomContextProvider>
                  <AppInternal />
                </RoomContextProvider>
              </BrowserRouter>
            </IdentityContextProvider>
          </Suspense>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
