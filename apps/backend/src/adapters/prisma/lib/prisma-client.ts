import { Effect, Config } from "effect"
import { PrismaClient } from "@prisma/client"

export const makePrismaClient = Effect.gen(function* () {
  const databaseUrl = yield* Config.string("DATABASE_URL")
  return new PrismaClient({ datasourceUrl: databaseUrl })
})
