import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { MandeApiError } from "./types/api";
export { MandeApiError };

// Set NEXT_PUBLIC_API_URL to point any build (dev, staging, production) at another API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// The access token lives in memory only, never in sessionStorage or
// localStorage, so a script injected into the page can't read it from
// storage. It's short-lived (15 minutes); the login itself is the refresh
// token, in an httpOnly cookie scripts can't touch. A reload or a new tab
// starts with no access token and swaps the cookie for one before its first
// API call (see restoreSession).
// ─────────────────────────────────────────────────────────────────────────────

let currentAccessToken: string | null = null;

/** The access token, if this page has one yet. */
export function getStoredAccessToken(): string | null {
  return currentAccessToken;
}

export function setStoredAccessToken(token: string | null): void {
  currentAccessToken = token;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mande:auth_token_changed", { detail: { token } }));
  }
}

/**
 * Main Axios client instance
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Dedicated auth client for refresh calls to avoid interceptor recursion
 */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Calls that work without a login (or are the login): no session to restore first, and no refresh on a 401. */
const isPublicAuthRoute = (url: string) =>
  /^\/?auth\/(login|register|refresh|invites\/accept|verify-email|password\/(forgot|reset))/.test(url);

let sessionRestore: Promise<void> | null = null;

/**
 * Once per page load: swaps the refresh cookie for an access token, so a
 * reload or a new tab stays signed in. Signed out (no cookie) it settles
 * without one, and calls go out anonymously; if the API couldn't be reached
 * it's tried again with the next call.
 */
function restoreSession(): Promise<void> {
  sessionRestore ??= refreshAccessToken().then(
    () => undefined,
    (error: unknown) => {
      // No answer at all (offline, API down): try again on the next call
      if (!(error as AxiosError)?.response) sessionRestore = null;
    },
  );
  return sessionRestore;
}

// Request interceptor: attach bearer token (restoring the session first on a fresh page)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined" && !currentAccessToken && !isPublicAuthRoute(config.url ?? "")) {
      await restoreSession();
    }
    const token = getStoredAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshInFlight: Promise<string> | null = null;

type RefreshError = AxiosError<{ error?: { code?: string } }>;

async function requestAccessToken(): Promise<string> {
  try {
    const response = await refreshClient.post<{ accessToken: string }>("/auth/refresh");
    const token = response.data?.accessToken;
    if (!token) throw new Error("The refresh response had no access token");
    return token;
  } catch (error) {
    // Another tab swapped the same cookie a moment ago and the browser now
    // holds its new one: ask once more, with that
    if ((error as RefreshError)?.response?.data?.error?.code !== "REFRESH_RACE") throw error;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const response = await refreshClient.post<{ accessToken: string }>("/auth/refresh");
    const token = response.data?.accessToken;
    if (!token) throw new Error("The refresh response had no access token");
    return token;
  }
}

/**
 * Swaps the refresh cookie for a new access token, and stores it. Everyone
 * in this tab asking at once (API calls, the live socket) shares one request:
 * the API rotates the refresh token on each use. Another tab refreshing at
 * the same moment gets a "race" answer, which is retried once.
 *
 * If the API turns the refresh down, the login is over: the token is cleared
 * and "mande:session-expired" goes out. A network failure leaves it as is.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = requestAccessToken()
      .then((token) => {
        setStoredAccessToken(token);
        return token;
      })
      .catch((error: unknown) => {
        const status = (error as AxiosError)?.response?.status;
        if (status === 401 || status === 403) {
          setStoredAccessToken(null);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mande:session-expired"));
          }
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// Response interceptor: handle 401 refresh rotation and normalized errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string; message?: string; details?: Record<string, unknown> } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // A signed-in call turned down because its token ran out: refresh once and
    // send it again. A call sent without a token (signed out) isn't retried:
    // restoreSession already found no login.
    const hadToken = !!originalRequest?.headers?.Authorization;

    if (status === 401 && originalRequest && !originalRequest._retry && hadToken && !isPublicAuthRoute(url)) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        return Promise.reject(normalizeError(error));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error: AxiosError<{ error?: { code?: string; message?: string; details?: Record<string, unknown> } }>): MandeApiError {
  const status = error.response?.status || 500;
  const errorData = error.response?.data?.error;
  const code = errorData?.code || (error.code ?? "UNKNOWN_ERROR");
  const message = errorData?.message || error.message || "An unexpected error occurred.";
  const details = errorData?.details;

  return new MandeApiError(status, code, message, details);
}

export function getErrorMessage(err: unknown, fallback = "An error occurred. Please try again."): string {
  if (err instanceof MandeApiError) {
    if (err.details && typeof err.details === "object" && !Array.isArray(err.details)) {
      const entries = Object.entries(err.details);
      if (entries.length > 0) {
        const [, val] = entries[0];
        if (Array.isArray(val) && val.length > 0) {
          return String(val[0]);
        }
        if (typeof val === "string") {
          return val;
        }
      }
    }
    return err.message || fallback;
  }
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}

