import { CssBaseline, ThemeProvider } from "@mui/material"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom"

import { AppShell } from "./nav"
import {
  HomePage,
  PatientDashboardPage,
  ProviderDashboardPage,
  RequestRoomPage,
} from "./pages"
import { appTheme } from "./theme"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "patient", element: <PatientDashboardPage /> },
      { path: "provider", element: <ProviderDashboardPage /> },
      { path: "requests/:requestId", element: <RequestRoomPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
