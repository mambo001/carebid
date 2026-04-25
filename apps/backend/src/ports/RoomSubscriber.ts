import { Context } from "effect"

export class RoomSubscriber extends Context.Tag("@carebid/RoomSubscriber")<
  RoomSubscriber,
  {
    readonly _tag: "RoomSubscriber"
  }
>() {}
