import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material"
import { useEffect } from "react"
import { NavLink, Outlet } from "react-router-dom"

import { useSessionQuery } from "../../lib/queries"
import { APP_NAME, primaryNavigation } from "../contants"
import { useAppState } from "../context"

export function AppShell() {
  const sessionQuery = useSessionQuery()
  const setSession = useAppState((state) => state.setSession)

  useEffect(() => {
    if (sessionQuery.data?.session) {
      setSession(sessionQuery.data.session)
    }
  }, [sessionQuery.data, setSession])

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Typography variant="h6" fontWeight={800} color="primary.main">
            {APP_NAME}
          </Typography>

          <Stack direction="row" spacing={1}>
            {primaryNavigation.map((item) => (
              <Button key={item.to} component={NavLink} to={item.to} color="inherit">
                {item.label}
              </Button>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
