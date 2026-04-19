import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material"

import { useSessionQuery, useSwitchRoleMutation } from "../../lib/queries"

export function AuthStatusCard() {
  const sessionQuery = useSessionQuery()
  const switchRole = useSwitchRoleMutation()
  const session = sessionQuery.data?.session

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Demo auth status
            </Typography>
            <Typography color="text.secondary">
              This is the app-facing session boundary. Neon Auth can replace this without changing the UI contracts.
            </Typography>
          </div>

          <Alert severity="info">
            Session mode: {session?.mode ?? "demo"} · Active role: {session?.role ?? "none"}
          </Alert>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {session?.patientProfile && <Chip label={`Patient: ${session.patientProfile.displayName}`} />}
            {session?.providerProfile && <Chip label={`Provider: ${session.providerProfile.displayName}`} />}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => switchRole.mutate("patient")}>Use patient role</Button>
            <Button variant="outlined" onClick={() => switchRole.mutate("provider")}>Use provider role</Button>
            <Button variant="text" onClick={() => switchRole.mutate(undefined)}>Clear role</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
