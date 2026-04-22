import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL ?? "postgresql://neon:neon@127.0.0.1:5432/neondb" },
  },
})

async function seed() {
  console.info("Seeding database...")

  await prisma.providerCategoryAssignment.deleteMany()
  await prisma.bidHistory.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.careRequest.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.demoSession.deleteMany()

  console.info("Creating demo session...")
  const session = await prisma.demoSession.upsert({
    where: { authUserId: "demo-user-001" },
    update: {},
    create: {
      authUserId: "demo-user-001",
      email: "demo@carebid.local",
      activeRole: "patient",
    },
  })

  console.info("Creating patient...")
  const patient = await prisma.patient.upsert({
    where: { authUserId: "demo-user-001" },
    update: {},
    create: {
      authUserId: "demo-user-001",
      email: "demo@carebid.local",
      displayName: "Demo Patient",
      locationCity: "Manila",
      locationRegion: "NCR",
    },
  })

  console.info("Creating provider...")
  const provider = await prisma.provider.upsert({
    where: { authUserId: "demo-provider-001" },
    update: {},
    create: {
      authUserId: "demo-provider-001",
      email: "provider@carebid.local",
      displayName: "Demo Provider",
      verificationStatus: "verified",
      verificationMode: "demo_auto",
    },
  })

  await prisma.providerCategoryAssignment.create({
    data: {
      providerId: provider.id,
      category: "specialist_consult",
    },
  })

  console.info("Creating care request...")
  const careRequest = await prisma.careRequest.create({
    data: {
      patientId: patient.id,
      category: "specialist_consult",
      title: "Neurology Consultation",
      sanitizedSummary: "Looking for a neurologist for follow-up consultation.",
      targetBudget: 500000,
      locationCity: "Manila",
      locationRegion: "NCR",
      preferredStartDate: new Date("2026-05-01"),
      preferredEndDate: new Date("2026-06-01"),
      urgency: "routine",
      serviceMode: "either",
      details: {},
      status: "open",
      expiresAt: new Date("2026-12-31"),
    },
  })

  console.info("Creating sample bids...")
  await prisma.bid.createMany({
    data: [
      {
        careRequestId: careRequest.id,
        providerId: provider.id,
        amount: 450000,
        availableDate: new Date("2026-05-15"),
        notes: "Available for consultation next month.",
        status: "active",
      },
    ],
  })

  console.info("Seeding complete!")
  console.info({ session, patient, provider, careRequest })
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
