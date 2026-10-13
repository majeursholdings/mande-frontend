// ─────────────────────────────────────────────────────────────────────────────
// Public platform settings: the job rules the help pages quote (bonus,
// rejection charge, review and fault windows, payment shares), as the super
// admins set them. Read on the server with plain fetch so Next.js caches it
// for a minute. Null when the API can't be reached.
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE_URL } from "@/lib/api";

/** GET /settings/public-rules. Percentages are whole numbers; the schedule's shares add up to 100. */
export type PublicJobRules = {
  bonusPercent: number;
  rejectionChargePercent: number;
  maxRejections: number;
  reviewWindowHours: number;
  faultReportDays: number;
  maxExtensionPercent: number;
  /** Percent of a job's amount paid at each milestone ("accepted", "frame", ..., "signed-off"). */
  paymentSchedule: Record<string, number>;
};

const REVALIDATE_SECONDS = 60;

export async function getPublicJobRules(): Promise<PublicJobRules | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/public-rules`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      console.error(`Public rules fetch failed with ${response.status}`);
      return null;
    }
    const data = (await response.json()) as { rules?: PublicJobRules };
    return data.rules ?? null;
  } catch (error) {
    console.error("Public rules fetch failed", error);
    return null;
  }
}
