import { io, Socket } from "socket.io-client";
import { getStoredAccessToken } from "@/lib/api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const token = getStoredAccessToken();
  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      path: "/socket.io",
      auth: (cb) => {
        cb({ token: getStoredAccessToken() });
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect_error", (error) => {
      if (error.message.includes("unauthorized") || error.message.includes("jwt") || error.message.includes("token")) {
        // Auth expired: will retry automatically when token is refreshed
      }
    });
  } else if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("mande:auth_token_changed", (e: Event) => {
    const detail = (e as CustomEvent<{ token: string | null }>).detail;
    if (!detail?.token) {
      disconnectSocket();
    } else {
      if (socketInstance && !socketInstance.connected) {
        socketInstance.connect();
      }
    }
  });
}


