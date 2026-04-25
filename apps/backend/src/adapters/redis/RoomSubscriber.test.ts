import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"

import { RequestId, UserId } from "../../data/branded"
import { DraftRequest } from "../../data/entities"
import { roomChannelRequestId, roomUpdatePayload } from "./RoomSubscriber"

describe("Redis RoomSubscriber helpers", () => {
  it("extracts request ids only from room update channels", () => {
    expect(roomChannelRequestId("room:req_123")).toBe("req_123")
    expect(roomChannelRequestId("rooms:req_123")).toBeNull()
    expect(roomChannelRequestId("room:")).toBeNull()
  })

  it("serializes room updates using the SSE request payload shape", () => {
    const request = new DraftRequest({
      id: Schema.decodeUnknownSync(RequestId)("req_123"),
      patientId: Schema.decodeUnknownSync(UserId)("patient_123"),
      title: "MRI scan",
      description: "Need availability",
      category: "imaging",
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
    })

    expect(JSON.parse(roomUpdatePayload(request))).toEqual({
      request: {
        _tag: "DraftRequest",
        id: "req_123",
        patientId: "patient_123",
        title: "MRI scan",
        description: "Need availability",
        category: "imaging",
        createdAt: "2026-04-25T00:00:00.000Z",
      },
    })
  })
})
