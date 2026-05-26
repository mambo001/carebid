import React from "react"
import {
  Box,
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
      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Chip
                label="Reverse-bid healthcare marketplace demo"
                color="secondary"
                variant="outlined"
                sx={{ alignSelf: "start", bgcolor: "background.paper" }}
              />
              <Typography variant="h1" sx={{ maxWidth: 780 }}>
                Patients post care requests. Providers compete with price and availability.
              </Typography>
              <Typography variant="h3" color="text.secondary" sx={{ maxWidth: 680 }}>
                CareBid focuses the demo on specialist consults and imaging, with authenticated workflows, Postgres persistence, and live bidding rooms.
              </Typography>
            </Stack>

            {isAuthenticated ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button component={RouterLink} to="/patient" variant="contained" size="large">
                  Enter patient workspace
                </Button>
                <Button component={RouterLink} to="/provider" variant="outlined" size="large">
                  Enter provider workspace
                </Button>
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button component={RouterLink} to="/sign-in" variant="contained" size="large">
                  Sign in
                </Button>
                <Button component={RouterLink} to="/sign-up" variant="outlined" size="large">
                  Create account
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {isAuthenticated && <AuthStatusCard />}

      <Box>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" color="primary.main">
            Demo coverage
          </Typography>
          <Typography variant="h2">Marketplace request types</Typography>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {providerCategories.map((category) => (
          <Grid key={category} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%" }}>
                <Stack spacing={2}>
                  <Chip
                    label={category.replaceAll("_", " ")}
                    color="secondary"
                    variant="outlined"
                    sx={{ alignSelf: "start" }}
                  />
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
