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
import type { AuthEnv } from "../middleware/auth"

const decodePatientInput = Schema.decodeUnknownSync(PatientOnboardingInputSchema)
const decodePatientResponse = Schema.decodeUnknownSync(PatientOnboardingResponseSchema)
const decodeProviderInput = Schema.decodeUnknownSync(ProviderOnboardingInputSchema)
const decodeProviderResponse = Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)

export const createOnboardingRoutes = () => {
  const app = new Hono<AuthEnv>()

  app.post("/onboarding/patient", async (c) => {
    const identity = { authUserId: c.get("authUserId"), email: c.get("authEmail") }
    const input = decodePatientInput(await c.req.json())

    return runEffect(
      c.env,
      Effect.gen(function* () {
        const result = yield* onboardPatient(identity, input)
        return c.json(decodePatientResponse({ ok: true, ...result }), 201)
      }).pipe(handleAppErrors),
    )
  })

  app.post("/onboarding/provider", async (c) => {
    const identity = { authUserId: c.get("authUserId"), email: c.get("authEmail") }
    const input = decodeProviderInput(await c.req.json())

    return runEffect(
      c.env,
      Effect.gen(function* () {
        const result = yield* onboardProvider(identity, input)
        return c.json(decodeProviderResponse({ ok: true, ...result }), 201)
      }).pipe(handleAppErrors),
    )
  })

  return app
}
