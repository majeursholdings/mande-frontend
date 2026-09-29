import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter } from "./fonts";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/queryProvider";

export const metadata: Metadata = {
  title: "Mande",
  description: "Mande Platform",
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
