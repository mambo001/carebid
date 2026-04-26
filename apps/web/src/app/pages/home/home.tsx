import React from "react"
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"

import { providerCategories } from "@carebid/shared"

import { useAppState } from "../../context/app-state"
import { AuthStatusCard } from "./auth-status-card"

export function HomePage() {
  const authUser = useAppState((state) => state.authUser)
  const isAuthenticated = Boolean(authUser)

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="overline" color="primary.main">
          Reverse-bid healthcare marketplace demo
        </Typography>
        <Typography variant="h1" sx={{ maxWidth: 720 }}>
          Patients post care requests. Providers compete with price and availability.
        </Typography>
        <Typography variant="h3" color="text.secondary" sx={{ maxWidth: 680 }}>
          CareBid focuses the first demo on specialist consults and imaging, with real-time bidding rooms backed by server-sent events.
        </Typography>
      </Stack>

      {isAuthenticated ? (
        <>
          <Stack direction="row" spacing={2}>
            <Button component={RouterLink} to="/patient" variant="contained" size="large">
              Enter patient workspace
            </Button>
            <Button component={RouterLink} to="/provider" variant="outlined" size="large">
              Enter provider workspace
            </Button>
          </Stack>

          <AuthStatusCard />

          <Card elevation={0} sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h2">Demo profiles are ready</Typography>
                <Typography color="text.secondary">
                  The backend automatically creates patient and provider demo profiles for each signed-in Firebase user. Use the workspace links above to move between request creation and provider bidding.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </>
      ) : (
        <Stack direction="row" spacing={2}>
          <Button component={RouterLink} to="/sign-in" variant="contained" size="large">
            Sign in
          </Button>
          <Button component={RouterLink} to="/sign-up" variant="outlined" size="large">
            Create account
          </Button>
        </Stack>
      )}

      <Grid container spacing={3}>
        {providerCategories.map((category) => (
          <Grid key={category} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Chip label={category.replaceAll("_", " ")} sx={{ alignSelf: "start" }} />
                  <Typography variant="h2">
                    {category === "specialist_consult" ? "Specialist consult marketplace" : "Imaging quote marketplace"}
                  </Typography>
                  <Typography color="text.secondary">
                    {category === "specialist_consult"
                      ? "Post a consult request, set your budget, and compare providers by availability and price."
                      : "Collect MRI, CT, X-ray, or ultrasound quotes with clear timing and body-area details."}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
