import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { MandeApiError } from "./types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

let currentAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Access token helpers for in-memory / state management
 */
export function getStoredAccessToken(): string | null {
  if (typeof window !== "undefined" && !currentAccessToken) {
    currentAccessToken = sessionStorage.getItem("mande_at");
  }
  return currentAccessToken;
}

export function setStoredAccessToken(token: string | null): void {
  currentAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("mande_at", token);
    } else {
      sessionStorage.removeItem("mande_at");
    }
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

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 refresh rotation and normalized errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string; message?: string; details?: Record<string, unknown> } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // If 401 and not already retried and not an auth initiation/refresh endpoint
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string | null) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshClient.post<{ accessToken: string }>(
          "/auth/refresh"
        );
        const newAccessToken = refreshResponse.data?.accessToken;

        setStoredAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setStoredAccessToken(null);

        // Notify session expiration if in browser
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mande:session-expired"));
        }
        return Promise.reject(normalizeError(error));
      } finally {
        isRefreshing = false;
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
