import { Alert, Button, Card, CardContent, MenuItem, Stack, Typography } from "@mui/material"
import { Form } from "react-final-form"
import { Select, TextField } from "mui-rff"

import type { ProviderOnboardingInput } from "@carebid/shared"

import { useProviderOnboardingMutation } from "../../../lib/queries"
import { useAppState } from "../../context/app-state"

const required = (value: unknown) => (value ? undefined : "Required")

export function ProviderOnboardingCard() {
  const onboarding = useProviderOnboardingMutation()
  const neonUser = useAppState((state) => state.neonUser)

  const initialValues: ProviderOnboardingInput = {
    displayName: neonUser?.name ?? "",
    email: neonUser?.email ?? "",
    licenseRegion: "",
    categories: ["imaging"],
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Provider onboarding
            </Typography>
            <Typography color="text.secondary">
              Create your provider profile with verified categories.
            </Typography>
          </div>

          <Form<ProviderOnboardingInput>
            initialValues={initialValues}
            onSubmit={(values) => onboarding.mutateAsync(values)}
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {onboarding.isSuccess && <Alert severity="success">Provider profile saved.</Alert>}
                  <TextField name="displayName" label="Display name" required fieldProps={{ validate: required }} />
                  <TextField name="email" label="Email" required fieldProps={{ validate: required }} />
                  <TextField name="licenseRegion" label="License region" />
                  <Select name="categories.0" label="Primary category" required fieldProps={{ validate: required }}>
                    <MenuItem value="specialist_consult">Specialist consult</MenuItem>
                    <MenuItem value="imaging">Imaging</MenuItem>
                  </Select>
                  <Button type="submit" variant="contained" disabled={submitting || onboarding.isPending}>
                    {onboarding.isPending ? "Saving..." : "Save provider profile"}
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
