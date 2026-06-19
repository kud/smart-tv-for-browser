import type * as Party from "partykit/server"

// The whole "backend": a room named by the pairing code. The TV and the phone
// both join it; the server forwards each command to the other side and
// broadcasts how many devices are present so each knows the other arrived.
// Because both devices only need to reach this one public server (never each
// other), it works on any network — no STUN/TURN/NAT dance.
export default class RemoteServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  private broadcastPresence() {
    const count = [...this.room.getConnections()].length
    this.room.broadcast(JSON.stringify({ type: "presence", count }))
  }

  onConnect() {
    this.broadcastPresence()
  }

  onClose() {
    this.broadcastPresence()
  }

  onMessage(message: string, sender: Party.Connection) {
    // Forward to everyone in the room except whoever sent it.
    this.room.broadcast(message, [sender.id])
  }
}

RemoteServer satisfies Party.Worker
