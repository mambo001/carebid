import { Alert, Card, CardContent, Stack, Typography } from "@mui/material"

export function SettingsPage() {
  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <div>
        <Typography variant="h2">Settings</Typography>
        <Typography color="text.secondary">App-level preferences and account controls will live here.</Typography>
      </div>

      <Card>
        <CardContent>
          <Alert severity="info">Settings is a placeholder page for the current demo.</Alert>
        </CardContent>
      </Card>
    </Stack>
  )
}
