import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import { Form } from "react-final-form"
import { TextField } from "mui-rff"

import type { PatientOnboardingInput } from "@carebid/shared"

import { usePatientOnboardingMutation } from "../../../lib/queries"

const required = (value: unknown) => (value ? undefined : "Required")

const initialValues: PatientOnboardingInput = {
  displayName: "Jamie Reyes",
  email: "jamie@carebid.local",
  locationCity: "Makati",
  locationRegion: "Metro Manila",
}

export function PatientOnboardingCard() {
  const onboarding = usePatientOnboardingMutation()

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Patient onboarding
            </Typography>
            <Typography color="text.secondary">
              Creates a demo patient profile tied to the current app session.
            </Typography>
          </div>

          <Form<PatientOnboardingInput>
            initialValues={initialValues}
            onSubmit={(values) => onboarding.mutateAsync(values)}
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {onboarding.isSuccess && <Alert severity="success">Patient profile saved.</Alert>}
                  <TextField name="displayName" label="Display name" required fieldProps={{ validate: required }} />
                  <TextField name="email" label="Email" required fieldProps={{ validate: required }} />
                  <TextField name="locationCity" label="City" required fieldProps={{ validate: required }} />
                  <TextField name="locationRegion" label="Region" required fieldProps={{ validate: required }} />
                  <Button type="submit" variant="contained" disabled={submitting || onboarding.isPending}>
                    {onboarding.isPending ? "Saving..." : "Save patient profile"}
                  </Button>
                </Stack>
              </form>
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
