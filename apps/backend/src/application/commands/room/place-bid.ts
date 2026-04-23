import { Effect } from "effect";

import type { BidInput } from "@carebid/shared";

import type { AuthIdentity } from "../../../domain/ports/session-repository";
import type { RoomState } from "../../../domain/entities";
import type {
  DatabaseError,
  RequestNotFoundError,
  RoomNotOpenError,
  SessionError,
} from "../../../domain/errors";
import { RoomNotifier } from "../../../domain/ports/room-notifier";
import { RoomRepository } from "../../../domain/ports/room-repository";

export const placeBidCommand = (
  identity: AuthIdentity,
  input: BidInput,
): Effect.Effect<
  RoomState,
  RoomNotOpenError | RequestNotFoundError | DatabaseError | SessionError,
  RoomRepository | RoomNotifier
> =>
  Effect.gen(function* () {
    const repo = yield* RoomRepository;
    const notifier = yield* RoomNotifier;
    const next = yield* repo.placeBid(identity.authUserId, input);
    yield* notifier.notifyRoomUpdated(input.requestId);
    return next;
  });
