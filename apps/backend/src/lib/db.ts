import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"

export const createPrismaClient = (connectionString: string) => {
  const adapter = new PrismaNeon({ connectionString })

  return new PrismaClient({ adapter })
}
