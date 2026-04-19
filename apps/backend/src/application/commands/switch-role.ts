import { Effect } from "effect"

import type { AppSession } from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

export const switchRole = (role: AppSession["role"]) =>
  Effect.flatMap(SessionRepository, (repository) => Effect.tryPromise(() => repository.switchRole(role)))
