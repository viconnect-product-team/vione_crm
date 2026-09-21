// BC-Mobile WebSocket Real-time Client (Socket.IO)
// Manages real-time connection for Moments, Comments, DM, NFC Touch, and Notifications.

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { NEST_API_URL } from "@/lib/api-client";
import { useViewerUserId } from "./use-viewer-user-id";

let globalSocket: Socket | null = null;

export function getConnectAppSocket(): Socket {
  if (typeof window === "undefined") {
    return {
      connected: false,
      connect: () => {},
      disconnect: () => {},
      emit: () => {},
      on: () => {},
      off: () => {},
      once: () => {},
    } as any;
  }
  if (!globalSocket) {
    globalSocket = io(NEST_API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 6000,
    });

    // Gracefully handle connection errors to avoid flooding console with uncaught red errors
    globalSocket.on("connect_error", () => {
      // Backend is temporarily unreachable or offline — quiet fallback
    });
  }
  return globalSocket;
}

export function useConnectAppSocket(room?: string) {
  const socketRef = useRef<Socket | null>(null);
  const viewerUserId = useViewerUserId();

  useEffect(() => {
    // Only connect if there is an authenticated user or a specific room requested
    if (!viewerUserId && !room) return;

    const socket = getConnectAppSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    const joinRooms = () => {
      // Join personal user room for targeted notifications, NFC tap alerts, DMs
      if (viewerUserId) {
        socket.emit("join:room", `user:${viewerUserId}`);
      }
      // Join specific room if provided (e.g. `moment:${momentId}`, `thread:${threadId}`)
      if (room) {
        socket.emit("join:room", room);
      }
    };

    if (socket.connected) {
      joinRooms();
    }
    socket.on("connect", joinRooms);

    return () => {
      socket.off("connect", joinRooms);
      if (room) {
        socket.emit("leave:room", room);
      }
    };
  }, [room, viewerUserId]);

  return socketRef.current || getConnectAppSocket();
}
