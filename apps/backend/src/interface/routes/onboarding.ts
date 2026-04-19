import { Effect } from "effect"
import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { onboardPatient } from "../../application/commands/onboard-patient"
import { onboardProvider } from "../../application/commands/onboard-provider"
import { handleAppErrors, runEffect } from "../../app"
import {
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
} from "@carebid/shared"

export const createOnboardingRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.post("/onboarding/patient", async (c) => {
    const input = Schema.decodeUnknownSync(PatientOnboardingInputSchema)(await c.req.json())

    return runEffect(
      c.env,
      onboardPatient(input).pipe(
        Effect.map((result) =>
          c.json(
            Schema.decodeUnknownSync(PatientOnboardingResponseSchema)({ ok: true, ...result }),
            201,
          ),
        ),
        handleAppErrors,
      ),
    )
  })

  app.post("/onboarding/provider", async (c) => {
    const input = Schema.decodeUnknownSync(ProviderOnboardingInputSchema)(await c.req.json())

    return runEffect(
      c.env,
      onboardProvider(input).pipe(
        Effect.map((result) =>
          c.json(
            Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)({ ok: true, ...result }),
            201,
          ),
        ),
        handleAppErrors,
      ),
    )
  })

  return app
}
