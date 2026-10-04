import type { Metadata } from "next";

// Log-in pages and dashboards: kept out of search results
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
