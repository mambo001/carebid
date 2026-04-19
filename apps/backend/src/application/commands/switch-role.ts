import { Effect } from "effect"

import type { AppSession } from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

export const switchRole = (role: AppSession["role"]) =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.switchRole(role)
  })
