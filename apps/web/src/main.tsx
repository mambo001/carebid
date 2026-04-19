import React from "react"
import ReactDOM from "react-dom/client"
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"

import { router } from "./router"

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0057B8",
    },
    secondary: {
      main: "#6A1B9A",
    },
    background: {
      default: "#F4F7FB",
    },
  },
  shape: {
    borderRadius: 16,
  },
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
