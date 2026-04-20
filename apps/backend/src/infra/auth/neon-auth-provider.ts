import { Effect, Layer } from "effect"

import { AuthError, DatabaseError } from "../../domain/errors"
import { AuthProvider, type AuthUser } from "../../domain/ports/auth-provider"
import { createPrismaClient } from "../../lib/db"

type JwtHeader = {
  alg?: string
  kid?: string
}

type JwtPayload = {
  aud?: string | ReadonlyArray<string>
  email?: string
  exp?: number
  iss?: string
  nbf?: number
  sub?: string
}

type JwkRow = {
  public_key: string
}

type RelationRow = {
  relation_name: string | null
}

const query = <Result>(fn: () => Promise<Result>): Effect.Effect<Result, DatabaseError> =>
  Effect.tryPromise({
    try: fn,
    catch: (error) => new DatabaseError({ message: String(error) }),
  })

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

const asArrayBuffer = (value: Uint8Array): ArrayBuffer =>
  value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer

const decodeBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const binary = atob(padded)

  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

const parseJwtPart = <T>(part: string): T => JSON.parse(textDecoder.decode(decodeBase64Url(part))) as T

const verifyTokenShape = (payload: JwtPayload): AuthUser => {
  const now = Math.floor(Date.now() / 1000)

  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new AuthError({ message: "Expired JWT token" })
  }

  if (typeof payload.nbf === "number" && payload.nbf > now) {
    throw new AuthError({ message: "JWT token is not active yet" })
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new AuthError({ message: "JWT token is missing subject" })
  }

  if (typeof payload.email !== "string" || payload.email.length === 0) {
    throw new AuthError({ message: "JWT token is missing email" })
  }

  return { id: payload.sub, email: payload.email }
}

const verifyJwtSignature = (
  jwt: string,
  jwk: JsonWebKey,
): Effect.Effect<void, AuthError> =>
  Effect.tryPromise({
    try: async () => {
      const [headerPart, payloadPart, signaturePart] = jwt.split(".")

      if (!headerPart || !payloadPart || !signaturePart) {
        throw new AuthError({ message: "Malformed JWT token" })
      }

      const key = await crypto.subtle.importKey("jwk", jwk, { name: "Ed25519" }, false, ["verify"])
      const isValid = await crypto.subtle.verify(
        "Ed25519",
        key,
        asArrayBuffer(decodeBase64Url(signaturePart)),
        asArrayBuffer(textEncoder.encode(`${headerPart}.${payloadPart}`)),
      )

      if (!isValid) {
        throw new AuthError({ message: "Invalid JWT signature" })
      }
    },
    catch: (error) =>
      error instanceof AuthError
        ? error
        : new AuthError({ message: `Unable to verify JWT signature: ${String(error)}` }),
  })

type CachedValue<T> = { value: T; expiresAt: number }

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

let cachedRelation: CachedValue<string> | null = null
const cachedKeys = new Map<string, CachedValue<JsonWebKey>>()
const cachedAuthUsers = new Map<string, CachedValue<AuthUser>>()

const resolveJwksRelation = (
  prisma: ReturnType<typeof createPrismaClient>,
): Effect.Effect<string, DatabaseError | AuthError> =>
  Effect.gen(function* () {
    const now = Date.now()

    if (cachedRelation && cachedRelation.expiresAt > now) {
      return cachedRelation.value
    }

    const rows = yield* query(() =>
      prisma.$queryRawUnsafe<Array<RelationRow>>(
        `SELECT COALESCE(to_regclass('neon_auth.jwks')::text, to_regclass('public.jwks')::text) AS relation_name`,
      ),
    )

    const relationName = rows[0]?.relation_name
    let resolved: string

    if (relationName === "neon_auth.jwks") {
      resolved = `"neon_auth"."jwks"`
    } else if (relationName === "jwks" || relationName === "public.jwks") {
      resolved = `public."jwks"`
    } else {
      return yield* Effect.fail(new AuthError({ message: "JWT key store is unavailable" }))
    }

    cachedRelation = { value: resolved, expiresAt: now + JWKS_CACHE_TTL_MS }
    return resolved
  })

const loadPublicKey = (
  prisma: ReturnType<typeof createPrismaClient>,
  kid: string,
): Effect.Effect<JsonWebKey, DatabaseError | AuthError> =>
  Effect.gen(function* () {
    const now = Date.now()
    const cached = cachedKeys.get(kid)

    if (cached && cached.expiresAt > now) {
      return cached.value
    }

    const relation = yield* resolveJwksRelation(prisma)
    const rows = yield* query(() =>
      prisma.$queryRawUnsafe<Array<JwkRow>>(
        `SELECT "publicKey" AS public_key
         FROM ${relation}
         WHERE "id" = $1
           AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        kid,
      ),
    )

    if (rows.length === 0) {
      return yield* Effect.fail(new AuthError({ message: "JWT signing key was not found" }))
    }

    const jwk = yield* Effect.try({
      try: () => JSON.parse(rows[0].public_key) as JsonWebKey,
      catch: (error) => new AuthError({ message: `Unable to parse JWT signing key: ${String(error)}` }),
    })

    cachedKeys.set(kid, { value: jwk, expiresAt: now + JWKS_CACHE_TTL_MS })
    return jwk
  })

const validateJwt = (
  prisma: ReturnType<typeof createPrismaClient>,
  token: string,
): Effect.Effect<AuthUser, AuthError | DatabaseError> =>
  Effect.gen(function* () {
    const now = Date.now()
    const cachedAuthUser = cachedAuthUsers.get(token)

    if (cachedAuthUser && cachedAuthUser.expiresAt > now) {
      return cachedAuthUser.value
    }

    const parts = token.split(".")
    const [headerPart, payloadPart] = parts

    if (!headerPart || !payloadPart || parts.length !== 3) {
      return yield* Effect.fail(new AuthError({ message: "Malformed JWT token" }))
    }

    const header = yield* Effect.try({
      try: () => parseJwtPart<JwtHeader>(headerPart),
      catch: (error) => new AuthError({ message: `Unable to parse JWT header: ${String(error)}` }),
    })

    if (header.alg !== "EdDSA") {
      return yield* Effect.fail(new AuthError({ message: `Unsupported JWT algorithm: ${header.alg ?? "unknown"}` }))
    }

    if (typeof header.kid !== "string" || header.kid.length === 0) {
      return yield* Effect.fail(new AuthError({ message: "JWT token is missing key id" }))
    }

    const payload = yield* Effect.try({
      try: () => parseJwtPart<JwtPayload>(payloadPart),
      catch: (error) => new AuthError({ message: `Unable to parse JWT payload: ${String(error)}` }),
    })

    const authUser = verifyTokenShape(payload)

    const publicKey = yield* loadPublicKey(prisma, header.kid)
    yield* verifyJwtSignature(token, publicKey)

    cachedAuthUsers.set(token, {
      value: authUser,
      expiresAt: payload.exp! * 1000,
    })

    return authUser
  })

export const makeNeonAuthProvider = (databaseUrl: string): AuthProvider => {
  const prisma = createPrismaClient(databaseUrl)

  return {
    validateToken: (token: string): Effect.Effect<AuthUser, AuthError | DatabaseError> =>
      validateJwt(prisma, token),
  }
}

export const makeNeonAuthProviderLayer = (databaseUrl: string) =>
  Layer.succeed(AuthProvider, makeNeonAuthProvider(databaseUrl))
