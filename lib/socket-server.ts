import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setIO(instance: SocketIOServer): void {
  io = instance;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToAdmin(event: string, payload: unknown): void {
  io?.to("admin-notifications").emit(event, payload);
}
