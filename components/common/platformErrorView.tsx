"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronRight, Copy, Check, RefreshCw, Home, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export interface PlatformErrorViewProps {
  error: Error & { digest?: string };
  reset?: () => void;
  platformName?: string;
  homeHref?: string;
  homeLabel?: string;
}

export function PlatformErrorView({
  error,
  reset,
  platformName = "Application",
  homeHref = "/",
  homeLabel = "Return home",
}: PlatformErrorViewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const errorPayload = [
      `Platform: ${platformName}`,
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${typeof window !== "undefined" ? window.location.href : "unknown"}`,
      `Error Name: ${error.name || "Error"}`,
      `Message: ${error.message || "Unknown error"}`,
      error.digest ? `Digest ID: ${error.digest}` : null,
      error.stack ? `\nStack Trace:\n${error.stack}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(errorPayload);
    setCopied(true);
    toast.success("Error details copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-error-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-error-50 text-error-600">
            <AlertCircle className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-error-800">
                {platformName}
              </span>
              <span className="text-xs font-medium text-mist-500">Isolated Error Boundary</span>
            </div>
            <h1 className="mt-2 text-xl font-bold font-text text-mist-950 sm:text-2xl">
              Failed to load page content
            </h1>
            <p className="mt-1 text-sm font-text text-mist-600">
              An error occurred in this view. Other sections of {platformName} and other platforms remain unaffected.
            </p>
          </div>
        </div>

        {/* Detailed error box */}
        <div className="mt-6 rounded-xl border border-mist-200 bg-mist-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-mist-200 px-1.5 py-0.5 font-mono text-xs font-semibold text-mist-800">
                  {error.name || "Error"}
                </span>
                {error.digest && (
                  <span className="font-mono text-xs text-mist-500">Digest: {error.digest}</span>
                )}
              </div>
              <p className="mt-2 font-mono text-sm font-medium text-error-950 break-words whitespace-pre-wrap">
                {error.message || "An unexpected error occurred."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-mist-300 bg-white px-3 py-1.5 text-xs font-medium font-text text-mist-700 shadow-2xs transition hover:bg-mist-100 active:scale-95 cursor-pointer"
              title="Copy error details to clipboard"
            >
              {copied ? <Check className="size-3.5 text-primary-600" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy details"}</span>
            </button>
          </div>

          {error.stack && (
            <div className="mt-4 border-t border-mist-200 pt-3">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-medium font-text text-mist-700 hover:text-mist-950 cursor-pointer"
              >
                {showDetails ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                <span>{showDetails ? "Hide technical stack trace" : "View technical stack trace"}</span>
              </button>
              {showDetails && (
                <div className="mt-2.5">
                  <pre className="max-h-60 overflow-auto rounded-lg bg-mist-950 p-3.5 font-mono text-xs leading-relaxed text-mist-200 whitespace-pre">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {reset && (
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold font-text text-white shadow-xs transition hover:bg-primary-700 active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="size-4" />
              <span>Try again</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm font-semibold font-text text-mist-800 shadow-2xs transition hover:bg-mist-50 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="size-4" />
            <span>Reload page</span>
          </button>
          {homeHref && (
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium font-text text-mist-600 transition hover:text-mist-950"
            >
              <Home className="size-4" />
              <span>{homeLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
