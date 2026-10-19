import * as Sentry from "@sentry/nextjs";

// Sentry settings shared by the browser, server and edge runtimes (see
// instrumentation-client.ts and instrumentation.ts). Without
// NEXT_PUBLIC_SENTRY_DSN, Sentry stays off.
//
// Nothing personal is sent: no user details, cookies, headers, bodies, query
// strings or local variables. Pages here show wallets, KYC and payments.
export const sentryBaseOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  // Every request locally, a tenth in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
    genAI: { inputs: false, outputs: false },
  },
} satisfies Sentry.BrowserOptions;

const reported = new WeakSet<Error>();

/**
 * Reports an error an error boundary caught (those never reach the browser's
 * error handler). Called while rendering, so it skips errors already sent.
 */
export function reportBoundaryError(error: Error) {
  if (typeof window === "undefined" || reported.has(error)) return;
  reported.add(error);
  Sentry.captureException(error);
}
