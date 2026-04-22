import { HttpApi, OpenApi } from "@effect/platform"

import { OnboardingGroup, RequestGroup, SessionGroup } from "./groups"

export const CarebidApi = HttpApi.make("carebid-api")
  .add(SessionGroup)
  .add(OnboardingGroup)
  .add(RequestGroup)
  .annotate(OpenApi.Description, "CareBid backend HTTP API")
  .annotate(OpenApi.Summary, "Sessions, onboarding, requests, room state, and streaming updates")
