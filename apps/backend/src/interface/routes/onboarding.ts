import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { onboardPatient } from "../../application/commands/onboard-patient"
import { onboardProvider } from "../../application/commands/onboard-provider"
import { runAppEffect } from "../../app"
import {
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
} from "@carebid/shared"

export const createOnboardingRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.post("/onboarding/patient", async (c) => {
    const body = await c.req.json()
    const input = Schema.decodeUnknownSync(PatientOnboardingInputSchema)(body)

    return runAppEffect(
      c.env,
      onboardPatient(input),
      (result) =>
        c.json(
          Schema.decodeUnknownSync(PatientOnboardingResponseSchema)({
            ok: true,
            ...result,
          }),
          201,
        ),
    )
  })

  app.post("/onboarding/provider", async (c) => {
    const body = await c.req.json()
    const input = Schema.decodeUnknownSync(ProviderOnboardingInputSchema)(body)

    return runAppEffect(
      c.env,
      onboardProvider(input),
      (result) =>
        c.json(
          Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)({
            ok: true,
            ...result,
          }),
          201,
        ),
    )
  })

  return app
}
