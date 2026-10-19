import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/sentry";

// Sentry in the browser: errors, page loads and navigations, and a replay of
// the moments before an error. Replays hide all text and inputs and block
// images and video, so no personal details are recorded.
Sentry.init({
  ...sentryBaseOptions,
  // Send trace headers to the API too, so a page and its API calls share one trace
  tracePropagationTargets: [new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").origin],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
