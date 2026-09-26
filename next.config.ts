import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    experimental: {
      // Dev-only workaround for a Next.js 16.3 dev-server bug: it never marks
      // intercepted routes as interceptable (production builds do), so after a
      // job is opened from outside the jobs board, the router predicts that
      // page's layout for jobs clicked on the board and falls back to a full
      // reload instead of opening the sheet. With route prediction off in dev,
      // the router asks the server instead.
      optimisticRouting: phase !== PHASE_DEVELOPMENT_SERVER,
    },
    redirects() {
      return [
        // The manufacturer platform has no page of its own at its root.
        // Temporary (307), since this may later depend on being logged in.
        {
          source: "/manufacturer",
          destination: "/manufacturer/dashboard",
          permanent: false,
        },
      ];
    },
  };
}
