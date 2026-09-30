"use client";

import { PlatformErrorView } from "@/components/common/platformErrorView";

export default function SuperAdminPlatformError({
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
      platformName="Super Admin Platform"
      homeHref="/super-admin/dashboard"
      homeLabel="Super Admin Dashboard"
    />
  );
}
