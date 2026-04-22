import { HttpRouter } from "@effect/platform";

import { CarebidApi, OnboardingGroup, RequestGroup, SessionGroup } from "@carebid/api";
import { onboardingRouter } from "./onboarding-router";
import { requestRouter } from "./request-router";
import { sessionRouter } from "./session-router";

void CarebidApi;
void SessionGroup;
void OnboardingGroup;
void RequestGroup;

export const apiRouter = HttpRouter.empty.pipe(
  HttpRouter.concat(sessionRouter),
  HttpRouter.concat(onboardingRouter),
  HttpRouter.concat(requestRouter),
);
