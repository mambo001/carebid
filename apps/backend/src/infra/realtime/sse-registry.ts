import type { Response } from "express"

type Client = {
  readonly response: Response
  readonly heartbeat: NodeJS.Timeout
}

export class SseRegistry {
  private readonly rooms = new Map<string, Set<Client>>()

  add(roomId: string, response: Response) {
    const client: Client = {
      response,
      heartbeat: setInterval(() => {
        response.write(": keep-alive\n\n")
      }, 25_000),
    }

    const existing = this.rooms.get(roomId) ?? new Set<Client>()
    existing.add(client)
    this.rooms.set(roomId, existing)

    return () => this.remove(roomId, client)
  }

  broadcast(roomId: string, payload: string) {
    const clients = this.rooms.get(roomId)
    if (!clients) {
      return
    }

    for (const client of clients) {
      client.response.write(`data: ${payload}\n\n`)
    }
  }

  hasSubscribers(roomId: string) {
    return (this.rooms.get(roomId)?.size ?? 0) > 0
  }

  private remove(roomId: string, client: Client) {
    clearInterval(client.heartbeat)
    const clients = this.rooms.get(roomId)
    if (!clients) {
      return
    }

    clients.delete(client)
    if (clients.size === 0) {
      this.rooms.delete(roomId)
    }
  }
}

let registry: SseRegistry | null = null

export const getSseRegistry = () => {
  registry ??= new SseRegistry()
  return registry
}
