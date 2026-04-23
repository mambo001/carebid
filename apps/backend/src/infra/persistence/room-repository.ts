import { Effect, Layer } from "effect"
import { Prisma, PrismaClient } from "@prisma/client"

import type { AcceptBidInput, BidInput, WithdrawBidInput } from "@carebid/shared"

import { RoomBid, RoomState } from "../../domain/entities"
import { BidNotFoundError, DatabaseError, RequestNotFoundError, RoomNotOpenError, SessionError } from "../../domain/errors"
import { RoomRepository } from "../../domain/ports/room-repository"
import { createPrismaClient } from "../../lib/db"

type DbClient = PrismaClient | Prisma.TransactionClient

type ProviderActor = {
  id: string
  displayName: string
}

type RoomRequestRecord = {
  id: string
  status: "draft" | "open" | "awarded" | "expired"
  awardedBidId: string | null
  bids: Array<{
    id: string
    providerId: string
    amount: number
    availableDate: Date
    notes: string | null
    status: "active" | "withdrawn" | "accepted" | "rejected" | "expired"
    provider: { displayName: string }
  }>
}

const asRoomError = (error: unknown) =>
  error instanceof RequestNotFoundError ||
  error instanceof RoomNotOpenError ||
  error instanceof BidNotFoundError ||
  error instanceof SessionError ||
  error instanceof DatabaseError
    ? error
    : new DatabaseError({ message: String(error) })

const query = <Result, Error>(fn: () => Promise<Result>): Effect.Effect<Result, Error | DatabaseError> =>
  Effect.tryPromise({
    try: fn,
    catch: (error) => asRoomError(error) as Error | DatabaseError,
  })

const loadRoomRequest = async (db: DbClient, requestId: string): Promise<RoomRequestRecord> => {
  const request = await db.careRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      awardedBidId: true,
      bids: {
        where: {
          status: { in: ["active", "accepted"] },
        },
        orderBy: [{ amount: "asc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          providerId: true,
          amount: true,
          availableDate: true,
          notes: true,
          status: true,
          provider: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  })

  if (!request) {
    throw new RequestNotFoundError({ message: `Request ${requestId} not found` })
  }

  return request
}

const toRoomState = (request: RoomRequestRecord) =>
  new RoomState({
    requestId: request.id,
    status: request.status,
    awardedBidId: request.awardedBidId ?? undefined,
    connectedViewers: 0,
    bids: request.bids.map(
      (bid) =>
        new RoomBid({
          bidId: bid.id,
          providerId: bid.providerId,
          providerDisplayName: bid.provider.displayName,
          amount: bid.amount,
          availableDate: bid.availableDate.toISOString(),
          notes: bid.notes ?? undefined,
          status: bid.status === "active" || bid.status === "accepted" ? "active" : "withdrawn",
        }),
    ),
  })

const ensureRequestOpen = async (tx: Prisma.TransactionClient, requestId: string) => {
  const request = await tx.careRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  })

  if (!request) {
    throw new RequestNotFoundError({ message: `Request ${requestId} not found` })
  }

  if (request.status !== "open") {
    throw new RoomNotOpenError({ message: `Request ${requestId} is not open` })
  }

  return request
}

const insertBidHistory = (
  tx: Prisma.TransactionClient,
  data: Prisma.BidHistoryUncheckedCreateInput,
) => tx.bidHistory.create({ data })

const loadRoomState = (db: DbClient, requestId: string) => loadRoomRequest(db, requestId).then(toRoomState)

export const resolveProviderForActor = async (
  db: Pick<Prisma.TransactionClient, "provider">,
  actorAuthUserId: string,
): Promise<ProviderActor> => {
  const provider = await db.provider.findUnique({
    where: { authUserId: actorAuthUserId },
    select: {
      id: true,
      displayName: true,
    },
  })

  if (!provider) {
    throw new SessionError({ message: "Provider profile required before bidding" })
  }

  return provider
}

export const makePrismaRoomRepository = (databaseUrl: string): RoomRepository => {
  const prisma = createPrismaClient(databaseUrl)

  return {
    getRoomState: (requestId) => query(() => loadRoomState(prisma, requestId)),

    placeBid: (actorAuthUserId: string, input: BidInput) =>
      query(() =>
        prisma.$transaction(async (tx) => {
          await ensureRequestOpen(tx, input.requestId)
          const provider = await resolveProviderForActor(tx, actorAuthUserId)

          const existing = await tx.bid.findUnique({
            where: {
              careRequestId_providerId: {
                careRequestId: input.requestId,
                providerId: provider.id,
              },
            },
            select: {
              id: true,
              amount: true,
              availableDate: true,
              status: true,
            },
          })

          const bid = existing
            ? await tx.bid.update({
                where: { id: existing.id },
                data: {
                  amount: input.amount,
                  availableDate: new Date(input.availableDate),
                  notes: input.notes,
                  status: "active",
                },
              })
            : await tx.bid.create({
                data: {
                  careRequestId: input.requestId,
                  providerId: provider.id,
                  amount: input.amount,
                  availableDate: new Date(input.availableDate),
                  notes: input.notes,
                  status: "active",
                },
              })

            await insertBidHistory(tx, {
              bidId: bid.id,
              careRequestId: input.requestId,
              providerId: provider.id,
              actorAuthUserId,
              eventType: existing ? "updated" : "placed",
            oldAmountCents: existing?.amount,
            newAmountCents: input.amount,
            oldAvailableDate: existing?.availableDate,
            newAvailableDate: bid.availableDate,
          })

          return loadRoomState(tx, input.requestId)
        }),
      ),

    withdrawBid: (actorAuthUserId: string, input: WithdrawBidInput) =>
      query(() =>
        prisma.$transaction(async (tx) => {
          await ensureRequestOpen(tx, input.requestId)
          const provider = await resolveProviderForActor(tx, actorAuthUserId)

          const existing = await tx.bid.findUnique({
            where: {
              careRequestId_providerId: {
                careRequestId: input.requestId,
                providerId: provider.id,
              },
            },
          })

          if (!existing || existing.status !== "active") {
            throw new BidNotFoundError({ message: `Active bid for provider ${provider.id} was not found` })
          }

          await tx.bid.update({
            where: { id: existing.id },
            data: { status: "withdrawn" },
          })

          await insertBidHistory(tx, {
            bidId: existing.id,
            careRequestId: input.requestId,
            providerId: provider.id,
            actorAuthUserId,
            eventType: "withdrawn",
            oldAmountCents: existing.amount,
            newAmountCents: existing.amount,
            oldAvailableDate: existing.availableDate,
            newAvailableDate: existing.availableDate,
          })

          return loadRoomState(tx, input.requestId)
        }),
      ),

    acceptBid: (actorAuthUserId: string, input: AcceptBidInput) =>
      query(() =>
        prisma.$transaction(async (tx) => {
          await ensureRequestOpen(tx, input.requestId)

          const bids = await tx.bid.findMany({
            where: { careRequestId: input.requestId, status: "active" },
            select: {
              id: true,
              providerId: true,
              amount: true,
              availableDate: true,
            },
          })

          const acceptedBid = bids.find((bid) => bid.id === input.bidId)

          if (!acceptedBid) {
            throw new BidNotFoundError({ message: `Bid ${input.bidId} was not found` })
          }

          await tx.bid.update({
            where: { id: acceptedBid.id },
            data: { status: "accepted" },
          })

          const rejectedBids = bids.filter((bid) => bid.id !== acceptedBid.id)

          if (rejectedBids.length > 0) {
            await tx.bid.updateMany({
              where: { id: { in: rejectedBids.map((bid) => bid.id) } },
              data: { status: "rejected" },
            })
          }

          await tx.careRequest.update({
            where: { id: input.requestId },
            data: { status: "awarded", awardedBidId: acceptedBid.id },
          })

          await insertBidHistory(tx, {
            bidId: acceptedBid.id,
            careRequestId: input.requestId,
            providerId: acceptedBid.providerId,
            actorAuthUserId,
            eventType: "accepted",
            oldAmountCents: acceptedBid.amount,
            newAmountCents: acceptedBid.amount,
            oldAvailableDate: acceptedBid.availableDate,
            newAvailableDate: acceptedBid.availableDate,
          })

          if (rejectedBids.length > 0) {
            await tx.bidHistory.createMany({
              data: rejectedBids.map((bid) => ({
                bidId: bid.id,
                careRequestId: input.requestId,
                providerId: bid.providerId,
                actorAuthUserId,
                eventType: "rejected",
                oldAmountCents: bid.amount,
                newAmountCents: bid.amount,
                oldAvailableDate: bid.availableDate,
                newAvailableDate: bid.availableDate,
              })),
            })
          }

          return loadRoomState(tx, input.requestId)
        }),
      ),

    expireRoom: (actorAuthUserId: string, requestId: string) =>
      query(() =>
        prisma.$transaction(async (tx) => {
          await ensureRequestOpen(tx, requestId)

          const bids = await tx.bid.findMany({
            where: { careRequestId: requestId, status: "active" },
            select: {
              id: true,
              providerId: true,
              amount: true,
              availableDate: true,
            },
          })

          if (bids.length > 0) {
            await tx.bid.updateMany({
              where: { id: { in: bids.map((bid) => bid.id) } },
              data: { status: "expired" },
            })

            await tx.bidHistory.createMany({
              data: bids.map((bid) => ({
                bidId: bid.id,
                careRequestId: requestId,
                providerId: bid.providerId,
                actorAuthUserId,
                eventType: "expired",
                oldAmountCents: bid.amount,
                newAmountCents: bid.amount,
                oldAvailableDate: bid.availableDate,
                newAvailableDate: bid.availableDate,
              })),
            })
          }

          await tx.careRequest.update({
            where: { id: requestId },
            data: { status: "expired" },
          })

          return loadRoomState(tx, requestId)
        }),
      ),
  }
}

export const makePrismaRoomRepositoryLayer = (databaseUrl: string) =>
  Layer.succeed(RoomRepository, makePrismaRoomRepository(databaseUrl))
