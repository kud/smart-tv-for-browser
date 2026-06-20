/// <reference types="@cloudflare/workers-types" />

// The whole "backend": a Durable Object instance per pairing code. The TV and
// the phone both open a WebSocket to /?room=CODE; the Worker routes them to the
// one DO named by that code (idFromName is deterministic), which forwards each
// command to the other side and broadcasts how many devices are present.
//
// Because both devices only ever reach this one public server (never each
// other), it works on any network — no STUN/TURN/NAT dance like WebRTC needed.

export interface Env {
  REMOTE_ROOM: DurableObjectNamespace
}

export class RemoteRoom {
  constructor(private readonly state: DurableObjectState) {}

  // Tell everyone still in the room how many devices are present, so each side
  // knows once the other has arrived (presence >= 2). `exclude` drops a socket
  // that is mid-close — during webSocketClose it may still be listed.
  private broadcastPresence(exclude?: WebSocket) {
    const sockets = this.state
      .getWebSockets()
      .filter((socket) => socket !== exclude)
    const message = JSON.stringify({ type: "presence", count: sockets.length })
    for (const socket of sockets) socket.send(message)
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 })
    }

    const [client, server] = Object.values(new WebSocketPair())
    // Hibernation API: the DO can be evicted while the socket stays open, so an
    // idle paired remote costs nothing.
    this.state.acceptWebSocket(server)
    this.broadcastPresence()

    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(sender: WebSocket, message: string | ArrayBuffer) {
    // Forward to everyone in the room except whoever sent it.
    for (const socket of this.state.getWebSockets()) {
      if (socket !== sender) socket.send(message)
    }
  }

  webSocketClose(closing: WebSocket) {
    this.broadcastPresence(closing)
  }

  webSocketError(failed: WebSocket) {
    this.broadcastPresence(failed)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const room = new URL(request.url).searchParams.get("room")
    if (!room) return new Response("missing room", { status: 400 })

    const stub = env.REMOTE_ROOM.get(env.REMOTE_ROOM.idFromName(room))
    return stub.fetch(request)
  },
}
