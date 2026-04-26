import React from "react"
import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material"

import { signOutUser } from "../../../lib/auth"
import { useSessionQuery } from "../../../lib/queries"
import { useAppState } from "../../context/app-state"

export function AuthStatusCard() {
  const sessionQuery = useSessionQuery()
  const session = sessionQuery.data?.session
  const authUser = useAppState((state) => state.authUser)
  const setAuthUser = useAppState((state) => state.setAuthUser)

  const handleSignOut = async () => {
    await signOutUser()
    setAuthUser(null)
    window.location.href = "/"
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Auth status
            </Typography>
            <Typography color="text.secondary">
              Signed in via Firebase Auth. Patient and provider are demo workspaces.
            </Typography>
          </div>

          <Alert severity="info">
            {authUser
              ? `Signed in as ${authUser.name} (${authUser.email})`
              : "Not signed in"}
            {session ? ` · Backend session: ${session.email}` : ""}
          </Alert>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Button variant="text" color="error" onClick={handleSignOut}>Sign out</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
