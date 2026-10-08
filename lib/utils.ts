import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "demi@example.com" → "d***@example.com" — shows where a code was sent without the full address. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@")
  if (at < 1) return email
  return `${email[0]}***${email.slice(at)}`
}

/**
 * A route param as typed: profile URLs use the readable userId
 * ("Ashley-Cole-1790835609603"), which may arrive still URL-encoded.
 */
export function decodeRouteParam(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
