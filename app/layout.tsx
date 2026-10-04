import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter } from "./fonts";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { SITE_NAME } from "@/lib/seo";
import { QueryProvider } from "@/components/providers/queryProvider";

export const metadata: Metadata = {
  // Lets pages give relative canonical and Open Graph addresses
  metadataBase: new URL(SITE_URL),
  title: "MANDE | Grow your furniture business",
  description:
    "Find real furniture jobs, get paid as each stage is approved, and build on the country's top machines at our Lagos factory.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", inter.variable, inter.className)}
    >
      <body className={cn("min-h-full flex flex-col font-sans", inter.className)}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
