import { io, Socket } from "socket.io-client";
import { getStoredAccessToken, refreshAccessToken, setStoredAccessToken } from "@/lib/api";
import { getQueryClient } from "@/lib/queryClient";

// ─────────────────────────────────────────────────────────────────────────────
// The live socket. The API closes it when the access token it connected with
// runs out (every 15 minutes), and turns a reconnect away with "unauthorized"
// while the token is stale. Socket.IO doesn't reconnect after either, so we
// get a fresh token and connect again ourselves. When the API says the login
// itself is over ("session:ended": logged out elsewhere, a password change,
// the account disabled) we don't reconnect: the session is cleared and the
// dashboard's SessionGuard sends them to log in.
// ─────────────────────────────────────────────────────────────────────────────

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socketInstance: Socket | null = null;
/** Set when the API ends the login, so the disconnect that follows isn't retried. */
let sessionEnded = false;
let isReauthenticating = false;
let lastReauthAt = 0;
/** If a fresh token is still turned away, don't refresh again straight away: that would loop. */
const REAUTH_COOLDOWN_MS = 30_000;

async function reconnectWithFreshToken(socket: Socket) {
  if (isReauthenticating || sessionEnded || Date.now() - lastReauthAt < REAUTH_COOLDOWN_MS) return;
  isReauthenticating = true;
  lastReauthAt = Date.now();
  try {
    await refreshAccessToken();
    // The auth callback reads the new token as it connects
    if (socket === socketInstance && !socket.connected) socket.connect();
  } catch {
    // Turned down: refreshAccessToken has ended the session. A network
    // failure: the next API call that refreshes reconnects us (see below).
  } finally {
    isReauthenticating = false;
  }
}

function endSession() {
  sessionEnded = true;
  disconnectSocket();
  setStoredAccessToken(null);
  // Drop the cached account so SessionGuard checks again, finds no login and redirects
  getQueryClient().clear();
  window.dispatchEvent(new CustomEvent("mande:session-expired"));
}

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const token = getStoredAccessToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (!socketInstance) {
    sessionEnded = false;
    const socket = io(SOCKET_URL, {
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

    socket.on("session:ended", endSession);

    socket.on("disconnect", (reason) => {
      // Anything but the server closing it (a dropped network, say) Socket.IO
      // retries by itself
      if (reason === "io server disconnect" && !sessionEnded) {
        void reconnectWithFreshToken(socket);
      }
    });

    socket.on("connect_error", (error) => {
      // The API's handshake check failed: the token's expired or revoked
      if (error.message === "unauthorized") {
        void reconnectWithFreshToken(socket);
      }
    });

    socketInstance = socket;
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
    } else if (socketInstance && !socketInstance.connected && !isReauthenticating) {
      // A new token (from any refresh): reconnect if we were closed for an old one
      socketInstance.connect();
    }
  });
}
