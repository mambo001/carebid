import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { Effect } from "effect"

import { makeNeonAuthProvider } from "../auth/neon-auth-provider"
import { createPrismaClient } from "../../lib/db"
import { makePrismaSessionRepository } from "./session-repository"

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process?.env ?? {}

const databaseUrl = env.DATABASE_URL
const benchmarkToken = env.NEON_TEST_BEARER_TOKEN
const shouldRunBenchmarks = env.RUN_NEON_BENCHMARKS === "1"

type JwtHeader = {
  kid?: string
}

const decodeBase64UrlJson = <T>(value: string): T => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return JSON.parse(atob(padded)) as T
}

const getTokenKid = (token: string): string | undefined => {
  const [header] = token.split(".")
  if (!header) {
    return undefined
  }

  return decodeBase64UrlJson<JwtHeader>(header).kid
}

const rawUpsertDemoSession = (authUserId: string, email: string) =>
  `INSERT INTO "DemoSession" ("authUserId", "email", "createdAt", "updatedAt")
   VALUES ('${authUserId}', '${email}', NOW(), NOW())
   ON CONFLICT ("authUserId")
   DO UPDATE SET "email" = EXCLUDED."email", "updatedAt" = NOW()
   RETURNING "authUserId", "email", "activeRole", "createdAt", "updatedAt"`

const rawSelectPatient = (authUserId: string) =>
  `SELECT *
   FROM "Patient"
   WHERE "authUserId" = '${authUserId}'
   LIMIT 1`

const rawSelectProvider = (authUserId: string) =>
  `SELECT p.*, COALESCE(array_agg(pca."category") FILTER (WHERE pca."category" IS NOT NULL), '{}') AS categories
   FROM "Provider" p
   LEFT JOIN "ProviderCategoryAssignment" pca ON pca."providerId" = p."id"
   WHERE p."authUserId" = '${authUserId}'
   GROUP BY p."id"
   LIMIT 1`

const rawBuildSessionBundle = (authUserId: string, email: string) =>
  `WITH session_row AS (
      INSERT INTO "DemoSession" ("authUserId", "email", "createdAt", "updatedAt")
      VALUES ('${authUserId}', '${email}', NOW(), NOW())
      ON CONFLICT ("authUserId")
      DO UPDATE SET "email" = EXCLUDED."email", "updatedAt" = NOW()
      RETURNING "authUserId", "email", "activeRole", "createdAt", "updatedAt"
    ),
    patient_row AS (
      SELECT row_to_json(p) AS patient
      FROM (
        SELECT *
        FROM "Patient"
        WHERE "authUserId" = '${authUserId}'
        LIMIT 1
      ) p
    ),
    provider_row AS (
      SELECT row_to_json(provider_payload) AS provider
      FROM (
        SELECT p.*, COALESCE(array_agg(pca."category") FILTER (WHERE pca."category" IS NOT NULL), '{}') AS categories
        FROM "Provider" p
        LEFT JOIN "ProviderCategoryAssignment" pca ON pca."providerId" = p."id"
        WHERE p."authUserId" = '${authUserId}'
        GROUP BY p."id"
        LIMIT 1
      ) provider_payload
    )
    SELECT row_to_json(session_row) AS session,
           (SELECT patient FROM patient_row LIMIT 1) AS patient,
           (SELECT provider FROM provider_row LIMIT 1) AS provider
    FROM session_row`

const measure = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now()

  try {
    return await operation()
  } finally {
    const elapsedMs = performance.now() - startedAt
    console.info(`[neon-benchmark] ${label}: ${elapsedMs.toFixed(2)}ms`)
  }
}

const shouldRun = Boolean(databaseUrl) && shouldRunBenchmarks
;(shouldRun ? describe : describe.skip)("Neon session integration benchmark", () => {
  const identity = {
    authUserId: `neon-benchmark-${Date.now()}`,
    email: `neon-benchmark-${Date.now()}@carebid.local`,
  }

  const prisma = createPrismaClient(databaseUrl!)
  const sessionRepository = makePrismaSessionRepository(databaseUrl!)
  const authProvider = makeNeonAuthProvider(databaseUrl!)
  const benchmarkTokenKid = benchmarkToken ? getTokenKid(benchmarkToken) : undefined

  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("measures raw Neon queries and session adapter operations", async () => {
    await measure("connect", () => prisma.$queryRawUnsafe("SELECT 1"))
    await measure("raw SELECT 1 #1", () => prisma.$queryRawUnsafe("SELECT 1"))
    await measure("raw SELECT 1 #2", () => prisma.$queryRawUnsafe("SELECT 1"))

    await measure("demoSession upsert #1", () =>
      prisma.demoSession.upsert({
        where: { authUserId: identity.authUserId },
        update: { email: identity.email },
        create: { authUserId: identity.authUserId, email: identity.email },
      }),
    )

    await measure("demoSession upsert #2", () =>
      prisma.demoSession.upsert({
        where: { authUserId: identity.authUserId },
        update: { email: identity.email },
        create: { authUserId: identity.authUserId, email: identity.email },
      }),
    )

    await measure("buildSession query: demoSession upsert", () =>
      prisma.demoSession.upsert({
        where: { authUserId: identity.authUserId },
        update: {},
        create: { authUserId: identity.authUserId, email: identity.email },
      }),
    )

    await measure("buildSession query: patient.findUnique", () =>
      prisma.patient.findUnique({ where: { authUserId: identity.authUserId } }),
    )

    await measure("buildSession query: provider.findUnique", () =>
      prisma.provider.findUnique({
        where: { authUserId: identity.authUserId },
        include: { categories: true },
      }),
    )

    await measure("buildSession queries: sequential direct", async () => {
      await prisma.demoSession.upsert({
        where: { authUserId: identity.authUserId },
        update: {},
        create: { authUserId: identity.authUserId, email: identity.email },
      })
      await prisma.patient.findUnique({ where: { authUserId: identity.authUserId } })
      await prisma.provider.findUnique({
        where: { authUserId: identity.authUserId },
        include: { categories: true },
      })
    })

    await measure("buildSession queries: Promise.all direct", async () => {
      await Promise.all([
        prisma.demoSession.upsert({
          where: { authUserId: identity.authUserId },
          update: {},
          create: { authUserId: identity.authUserId, email: identity.email },
        }),
        prisma.patient.findUnique({ where: { authUserId: identity.authUserId } }),
        prisma.provider.findUnique({
          where: { authUserId: identity.authUserId },
          include: { categories: true },
        }),
      ])
    })

    await measure("buildSession queries: raw SQL sequential", async () => {
      await prisma.$queryRawUnsafe(rawUpsertDemoSession(identity.authUserId, identity.email))
      await prisma.$queryRawUnsafe(rawSelectPatient(identity.authUserId))
      await prisma.$queryRawUnsafe(rawSelectProvider(identity.authUserId))
    })

    await measure("buildSession queries: raw SQL Promise.all", async () => {
      await Promise.all([
        prisma.$queryRawUnsafe(rawUpsertDemoSession(identity.authUserId, identity.email)),
        prisma.$queryRawUnsafe(rawSelectPatient(identity.authUserId)),
        prisma.$queryRawUnsafe(rawSelectProvider(identity.authUserId)),
      ])
    })

    await measure("buildSession query: raw SQL bundled CTE", () =>
      prisma.$queryRawUnsafe(rawBuildSessionBundle(identity.authUserId, identity.email)),
    )

    const coldSession = await measure("sessionRepository.getSession #1", () =>
      Effect.runPromise(sessionRepository.getSession(identity)),
    )
    const warmSession = await measure("sessionRepository.getSession #2", () =>
      Effect.runPromise(sessionRepository.getSession(identity)),
    )
    const switchedSession = await measure("sessionRepository.switchRole(patient)", () =>
      Effect.runPromise(sessionRepository.switchRole(identity, "patient")),
    )
    const clearedSession = await measure("sessionRepository.switchRole(undefined)", () =>
      Effect.runPromise(sessionRepository.switchRole(identity, undefined)),
    )

    expect(coldSession.authUserId).toBe(identity.authUserId)
    expect(warmSession.authUserId).toBe(identity.authUserId)
    expect(switchedSession.role).toBe("patient")
    expect(clearedSession.role).toBeUndefined()
  }, 120_000)

  it("measures auth provider token validation when a bearer token is supplied", async () => {
    if (!benchmarkToken) {
      console.info("[neon-benchmark] skipped auth validation benchmark: NEON_TEST_BEARER_TOKEN is not set")
      return
    }

    await measure("auth query: resolveJwksRelation", () =>
      prisma.$queryRawUnsafe(
        `SELECT COALESCE(to_regclass('neon_auth.jwks')::text, to_regclass('public.jwks')::text) AS relation_name`,
      ),
    )

    if (benchmarkTokenKid) {
      await measure(`auth query: loadPublicKey(${benchmarkTokenKid})`, () =>
        prisma.$queryRawUnsafe(
          `SELECT "publicKey" AS public_key
           FROM "neon_auth"."jwks"
           WHERE "id" = $1
             AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
           ORDER BY "createdAt" DESC
           LIMIT 1`,
          benchmarkTokenKid,
        ),
      )
    }

    const validation = await measure("authProvider.validateToken #1", async () => {
      try {
        const authUser = await Effect.runPromise(authProvider.validateToken(benchmarkToken))
        return { ok: true as const, authUser }
      } catch (error) {
        console.info(`[neon-benchmark] authProvider.validateToken #1 error: ${String(error)}`)
        return { ok: false as const, error }
      }
    })

    if (validation.ok) {
      expect(validation.authUser.email.length).toBeGreaterThan(0)
    }

    await measure("authProvider.validateToken #2", async () => {
      try {
        await Effect.runPromise(authProvider.validateToken(benchmarkToken))
      } catch (error) {
        console.info(`[neon-benchmark] authProvider.validateToken #2 error: ${String(error)}`)
      }
    })
  }, 120_000)
})
