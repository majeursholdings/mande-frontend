"use client";

import { PlatformErrorView } from "@/components/common/platformErrorView";

export default function WebsitePlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PlatformErrorView
      error={error}
      reset={reset}
      platformName="Website"
      homeHref="/"
      homeLabel="Return to Home"
    />
  );
}
