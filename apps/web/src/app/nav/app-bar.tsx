import React from "react"
import { AppBar as MuiAppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material"
import { NavLink, useNavigate } from "react-router-dom"

import { signOutUser } from "../../lib/auth"
import { useAppState } from "../context/app-state"
import { APP_NAME, primaryNavigation } from "../contants"

export function AppBar() {
  const navigate = useNavigate()
  const neonUser = useAppState((state) => state.neonUser)
  const setNeonUser = useAppState((state) => state.setNeonUser)

  const handleSignOut = async () => {
    await signOutUser()
    setNeonUser(null)
    navigate("/")
  }

  return (
    <MuiAppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Typography variant="h6" fontWeight={800} color="primary.main">
          {APP_NAME}
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
          <Stack direction="row" spacing={1}>
            {primaryNavigation.map((item) => (
              <Button key={item.to} component={NavLink} to={item.to} color="inherit">
                {item.label}
              </Button>
            ))}
          </Stack>
          {neonUser ? (
            <Button color="inherit" onClick={handleSignOut} size="small">
              Sign out
            </Button>
          ) : (
            <Button component={NavLink} to="/sign-in" color="inherit" size="small">
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}
