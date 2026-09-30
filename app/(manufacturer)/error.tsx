"use client";

import { PlatformErrorView } from "@/components/common/platformErrorView";

export default function ManufacturerPlatformError({
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
      platformName="Manufacturer Portal"
      homeHref="/manufacturer/dashboard"
      homeLabel="Manufacturer Dashboard"
    />
  );
}
