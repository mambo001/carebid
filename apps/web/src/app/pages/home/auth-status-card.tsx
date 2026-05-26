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
    <Card elevation={0}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h3">
            {authUser ? authUser.name : "Not signed in"}
          </Typography>
          <Alert severity="info">
            {authUser
              ? `${authUser.email}${session ? ` · Backend session verified` : ""}`
              : "Not signed in"}
          </Alert>
          <Button variant="text" color="error" onClick={handleSignOut} size="small">
            Sign out
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
