import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/sentry";

// Sentry on the server (Node.js and edge): errors from server components,
// route handlers and server actions, and a trace of each request.
export function register() {
  Sentry.init(sentryBaseOptions);
}

export const onRequestError = Sentry.captureRequestError;
