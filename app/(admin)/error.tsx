"use client";

import { PlatformErrorView } from "@/components/common/platformErrorView";

export default function AdminPlatformError({
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
      platformName="Admin Platform"
      homeHref="/admin/dashboard"
      homeLabel="Admin Dashboard"
    />
  );
}
