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

import { AuthStatusCard } from "./AuthStatusCard"
import { PatientOnboardingCard } from "./PatientOnboardingCard"
import { ProviderOnboardingCard } from "./ProviderOnboardingCard"

export function HomePage() {
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
          CareBid focuses the first demo on specialist consults and imaging, with real-time bidding rooms backed by Durable Objects.
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Button component={RouterLink} to="/patient" variant="contained" size="large">
          Enter patient flow
        </Button>
        <Button component={RouterLink} to="/provider" variant="outlined" size="large">
          Enter provider flow
        </Button>
      </Stack>

      <AuthStatusCard />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PatientOnboardingCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ProviderOnboardingCard />
        </Grid>
      </Grid>

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
