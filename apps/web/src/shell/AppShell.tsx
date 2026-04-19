import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material"
import { NavLink, Outlet } from "react-router-dom"

export function AppShell() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Typography variant="h6" fontWeight={800} color="primary.main">
            CareBid
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button component={NavLink} to="/" color="inherit">
              Home
            </Button>
            <Button component={NavLink} to="/patient" color="inherit">
              Patient
            </Button>
            <Button component={NavLink} to="/provider" color="inherit">
              Provider
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
