import { Effect } from "effect";

import type { WithdrawBidInput } from "@carebid/shared";

import type { AuthIdentity } from "../../../domain/ports/session-repository";
import type { RoomState } from "../../../domain/entities";
import type {
  BidNotFoundError,
  DatabaseError,
  RequestNotFoundError,
  RoomNotOpenError,
  SessionError,
} from "../../../domain/errors";
import { RoomNotifier } from "../../../domain/ports/room-notifier";
import { RoomRepository } from "../../../domain/ports/room-repository";

export const withdrawBidCommand = (
  identity: AuthIdentity,
  input: WithdrawBidInput,
): Effect.Effect<
  RoomState,
  | BidNotFoundError
  | RoomNotOpenError
  | RequestNotFoundError
  | DatabaseError
  | SessionError,
  RoomRepository | RoomNotifier
> =>
  Effect.gen(function* () {
    const repo = yield* RoomRepository;
    const notifier = yield* RoomNotifier;
    const next = yield* repo.withdrawBid(identity.authUserId, input);
    yield* notifier.notifyRoomUpdated(input.requestId);
    return next;
  });
