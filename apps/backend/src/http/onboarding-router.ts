import { HttpRouter } from "@effect/platform"
import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

import {
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
} from "@carebid/shared"

import { onboardPatient } from "../application/commands/onboard-patient"
import { onboardProvider } from "../application/commands/onboard-provider"
import { authenticate, decodeBody, json } from "./common"

const decodePatientResponse = Schema.decodeUnknownSync(PatientOnboardingResponseSchema)
const decodeProviderResponse = Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)

export const onboardingRouter = HttpRouter.empty.pipe(
  HttpRouter.post(
    "/api/onboarding/patient",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const input = yield* decodeBody(PatientOnboardingInputSchema, "Invalid patient onboarding payload")
      const result = yield* onboardPatient(identity, input)
      return json(decodePatientResponse({ ok: true, ...result }), 201)
    }),
  ),
  HttpRouter.post(
    "/api/onboarding/provider",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const input = yield* decodeBody(ProviderOnboardingInputSchema, "Invalid provider onboarding payload")
      const result = yield* onboardProvider(identity, input)
      return json(decodeProviderResponse({ ok: true, ...result }), 201)
    }),
  ),
)
