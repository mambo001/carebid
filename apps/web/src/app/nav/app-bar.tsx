import React from "react"
import { AppBar as MuiAppBar, Box, Button, Divider, Stack, Toolbar, Typography } from "@mui/material"
import { NavLink, useNavigate } from "react-router-dom"

import { signOutUser } from "../../lib/auth"
import { useAppState } from "../context/app-state"
import { APP_NAME, primaryNavigation } from "../contants"

export function AppBar() {
  const navigate = useNavigate()
  const authUser = useAppState((state) => state.authUser)
  const setAuthUser = useAppState((state) => state.setAuthUser)

  const handleSignOut = async () => {
    await signOutUser()
    setAuthUser(null)
    navigate("/")
  }

  return (
    <MuiAppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Typography variant="h6" fontWeight={900} color="primary.main" letterSpacing="-0.04em">
          {APP_NAME}
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
          <Stack direction="row" spacing={1}>
            {primaryNavigation.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                color="inherit"
                sx={{
                  color: "text.secondary",
                  "&.active": {
                    bgcolor: "info.main",
                    color: "primary.main",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          {authUser ? (
            <>
              <Divider orientation="vertical" flexItem variant="middle" />
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                {authUser.name}
              </Typography>
              <Button color="primary" onClick={handleSignOut} size="small" variant="outlined">
                Sign out
              </Button>
            </>
          ) : (
            <Button component={NavLink} to="/sign-in" color="primary" size="small" variant="contained">
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}
