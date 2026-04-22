import { PrismaClient } from "@prisma/client"

const prismaClients = new Map<string, PrismaClient>()

export const createPrismaClient = (connectionString: string) => {
  const cached = prismaClients.get(connectionString)

  if (cached) {
    return cached
  }

  const client = new PrismaClient({
    datasources: {
      db: { url: connectionString },
    },
  })

  prismaClients.set(connectionString, client)
  return client
}
