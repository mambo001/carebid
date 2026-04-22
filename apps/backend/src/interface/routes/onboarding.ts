import express from "express"
import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

import type { AppConfig } from "../../shared/config/runtime-env"
import { runEffect, sendErrorResponse } from "../../app"
import { onboardPatient } from "../../application/commands/onboard-patient"
import { onboardProvider } from "../../application/commands/onboard-provider"
import {
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
} from "@carebid/shared"
import type { AuthenticatedRequest } from "../middleware/auth"

const decodePatientInput = Schema.decodeUnknownSync(PatientOnboardingInputSchema)
const decodePatientResponse = Schema.decodeUnknownSync(PatientOnboardingResponseSchema)
const decodeProviderInput = Schema.decodeUnknownSync(ProviderOnboardingInputSchema)
const decodeProviderResponse = Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)

export const createOnboardingRoutes = (config: AppConfig) => {
  const router = express.Router()

  router.post("/onboarding/patient", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const input = decodePatientInput(req.body)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const result = yield* onboardPatient(identity, input)
          return decodePatientResponse({ ok: true, ...result })
        }),
      )

      res.status(201).json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/onboarding/provider", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const input = decodeProviderInput(req.body)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const result = yield* onboardProvider(identity, input)
          return decodeProviderResponse({ ok: true, ...result })
        }),
      )

      res.status(201).json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  return router
}
