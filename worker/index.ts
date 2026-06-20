/// <reference types="@cloudflare/workers-types" />

// The whole "backend": a Durable Object instance per pairing code. The TV and
// the phone both open a WebSocket to /?room=CODE; the Worker routes them to the
// one DO named by that code (idFromName is deterministic), which forwards each
// command to the other side and reports presence per role.
//
// Each connection announces its role with a `hello`: "app" = the website,
// "ext" = the companion extension's background worker, "phone" = the remote.
// Presence is reported as per-role counts so each side knows exactly which
// others are present — the phone can show whether the app and/or the extension
// are live, and the app can show whether the phone has arrived.
//
// Because both devices only ever reach this one public server (never each
// other), it works on any network — no STUN/TURN/NAT dance like WebRTC needed.

export interface Env {
  REMOTE_ROOM: DurableObjectNamespace
}

const ROLES = ["app", "ext", "phone"]

export class RemoteRoom {
  constructor(private readonly state: DurableObjectState) {}

  private roleOf(socket: WebSocket): string | null {
    try {
      return socket.deserializeAttachment()?.role ?? null
    } catch {
      return null
    }
  }

  // Tell everyone still in the room how many of each role are present, so each
  // side knows once the other kind has arrived. `exclude` drops a socket that is
  // mid-close — during webSocketClose it may still be listed.
  private broadcastPresence(exclude?: WebSocket) {
    const sockets = this.state
      .getWebSockets()
      .filter((socket) => socket !== exclude)
    const counts = { app: 0, ext: 0, phone: 0 }
    for (const socket of sockets) {
      const role = this.roleOf(socket)
      if (role === "app" || role === "ext" || role === "phone") {
        counts[role] += 1
      }
    }
    const message = JSON.stringify({ type: "presence", ...counts })
    for (const socket of sockets) socket.send(message)
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 })
    }

    const [client, server] = Object.values(new WebSocketPair())
    // Hibernation API: the DO can be evicted while the socket stays open, so an
    // idle paired remote costs nothing. The role is unknown until `hello`, so a
    // fresh connection doesn't change the counts yet.
    this.state.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(sender: WebSocket, message: string | ArrayBuffer) {
    const data = typeof message === "string" ? safeParse(message) : null

    // A role announcement: record it (survives hibernation via the attachment)
    // and republish presence. Not forwarded — it's for the server.
    if (data?.type === "hello" && ROLES.includes(data.role)) {
      sender.serializeAttachment({ role: data.role })
      this.broadcastPresence()
      return
    }

    // Everything else (presses) goes to everyone in the room except the sender.
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

const safeParse = (raw: string) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
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
