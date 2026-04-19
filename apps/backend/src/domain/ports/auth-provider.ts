import { Context, Effect } from "effect"

import { AuthError, DatabaseError } from "../errors"

export interface AuthUser {
  readonly id: string
  readonly email: string
}

export interface AuthProvider {
  readonly validateToken: (token: string) => Effect.Effect<AuthUser, AuthError | DatabaseError>
}

export const AuthProvider = Context.GenericTag<AuthProvider>("@carebid/AuthProvider")
