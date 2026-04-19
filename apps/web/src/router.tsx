import {
  Navigate,
  createBrowserRouter,
} from "react-router-dom"

import { AppShell } from "./shell/AppShell"
import { HomePage } from "./views/HomePage"
import { PatientDashboardPage } from "./views/PatientDashboardPage"
import { ProviderDashboardPage } from "./views/ProviderDashboardPage"
import { RequestRoomPage } from "./views/RequestRoomPage"

export const router = createBrowserRouter([
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
