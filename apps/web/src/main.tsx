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
      main: "#4682A9",
    },
    secondary: {
      main: "#749BC2",
    },
    background: {
      default: "#F6F4EB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2F4858",
      secondary: "#5B7384",
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
