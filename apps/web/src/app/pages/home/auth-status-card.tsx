import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material"

import { signOutUser } from "../../../lib/auth"
import { useSessionQuery, useSwitchRoleMutation } from "../../../lib/queries"
import { useAppState } from "../../context/app-state"

export function AuthStatusCard() {
  const sessionQuery = useSessionQuery()
  const switchRole = useSwitchRoleMutation()
  const session = sessionQuery.data?.session
  const neonUser = useAppState((state) => state.neonUser)
  const setNeonUser = useAppState((state) => state.setNeonUser)

  const handleSignOut = async () => {
    await signOutUser()
    setNeonUser(null)
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
              Signed in via Firebase Auth. Active role: {session?.role ?? "none"}
            </Typography>
          </div>

          <Alert severity="info">
            {neonUser
              ? `Signed in as ${neonUser.name} (${neonUser.email})`
              : "Not signed in"}
            {" · "}Active role: {session?.role ?? "none"}
          </Alert>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {session?.patientProfile && <Chip label={`Patient: ${session.patientProfile.displayName}`} />}
            {session?.providerProfile && <Chip label={`Provider: ${session.providerProfile.displayName}`} />}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => switchRole.mutate("patient")}>Use patient role</Button>
            <Button variant="outlined" onClick={() => switchRole.mutate("provider")}>Use provider role</Button>
            <Button variant="text" onClick={() => switchRole.mutate(undefined)}>Clear role</Button>
            <Button variant="text" color="error" onClick={handleSignOut}>Sign out</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
