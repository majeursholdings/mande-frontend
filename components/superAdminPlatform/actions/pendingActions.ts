"use client";

import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "@/components/adminPlatform/dashboardLayout/adminManufacturersContext";
import type { AdminJob } from "@/constant/admin";
import { MIN_SIGN_OFF_RATING } from "@/constant/jobWorkflow";
import type {
    DeletionRequestRecord,
    LeadReviewRecord,
    ManufacturerRecord,
    ManufacturerReviewRecord,
} from "@/constant/sampleDb";
import { API_PROVIDERS, type ApiKey, type ApiProvider } from "@/constant/superAdmin";
import { useOptionalSuperAdminSettings } from "../settingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// What's waiting for a super admin — the Actions page, and the count beside
// it in the menu: account deletions admins asked for, finished work a lead
// rated too low to sign off, manufacturers' low ratings of their lead, and
// anything stopping payments. Worked out from the records, so an action
// leaves the list the moment it's dealt with (here, or anywhere else).
// ─────────────────────────────────────────────────────────────────────────────

export type SuperAdminActionKind = "account-deletion" | "held-job" | "lead-rating" | "payments";

export const ACTION_KINDS: { value: SuperAdminActionKind; label: string; one: string; many: string }[] = [
    { value: "account-deletion", label: "Account deletions", one: "account deletion", many: "account deletions" },
    { value: "held-job", label: "Low job ratings", one: "low job rating", many: "low job ratings" },
    { value: "lead-rating", label: "Low lead ratings", one: "low lead rating", many: "low lead ratings" },
    { value: "payments", label: "Payments", one: "payment problem", many: "payment problems" },
];

export type SuperAdminAction =
    | { kind: "account-deletion"; id: string; at: string; manufacturer: ManufacturerRecord; request: DeletionRequestRecord }
    | { kind: "held-job"; id: string; at: string; job: AdminJob; review: ManufacturerReviewRecord }
    | { kind: "lead-rating"; id: string; at: string; job: AdminJob; review: LeadReviewRecord }
    | {
          kind: "payments";
          id: string;
          at: null;
          /** No platform can take real payments; or one is set to test keys. */
          problem: "no-live-keys" | "test-mode";
          /** For "test-mode", the platform. */
          provider: ApiProvider | null;
          /** Platforms whose active keys are test keys. */
          testProviders: ApiProvider[];
      };

const PAYMENT_PROVIDERS = API_PROVIDERS.filter((provider) => provider.group === "payments");

/** Payment problems first — they stop money coming in — then whatever has waited longest. */
export function getSuperAdminActions(
    jobs: AdminJob[],
    manufacturers: ManufacturerRecord[],
    apiKeys: ApiKey[] | null,
): SuperAdminAction[] {
    const deletions = manufacturers.flatMap((manufacturer): SuperAdminAction[] =>
        manufacturer.deletionRequest
            ? [
                  {
                      kind: "account-deletion",
                      id: `deletion-${manufacturer.id}`,
                      at: manufacturer.deletionRequest.requestedAt,
                      manufacturer,
                      request: manufacturer.deletionRequest,
                  },
              ]
            : [],
    );

    const heldJobs = jobs.flatMap((job): SuperAdminAction[] =>
        job.status === "in-review" && job.furtherReview
            ? [{ kind: "held-job", id: `held-${job.id}`, at: job.furtherReview.createdAt, job, review: job.furtherReview }]
            : [],
    );

    const leadRatings = jobs.flatMap((job) =>
        job.leadReviews
            .filter((review) => review.rating < MIN_SIGN_OFF_RATING && !review.followUp)
            .map(
                (review): SuperAdminAction => ({
                    kind: "lead-rating",
                    id: `lead-rating-${job.id}-${review.manufacturerId}`,
                    at: review.createdAt,
                    job,
                    review,
                }),
            ),
    );

    const active = (apiKeys ?? []).filter(
        (key) => key.isActive && PAYMENT_PROVIDERS.some((provider) => provider.value === key.provider),
    );
    const testProviders = active.filter((key) => key.mode === "test").map((key) => key.provider);
    const payments: SuperAdminAction[] = !apiKeys
        ? []
        : !active.some((key) => key.mode === "live")
          ? [{ kind: "payments", id: "payments-off", at: null, problem: "no-live-keys", provider: null, testProviders }]
          : testProviders.map((provider) => ({
                kind: "payments",
                id: `payments-test-${provider}`,
                at: null,
                problem: "test-mode",
                provider,
                testProviders,
            }));

    return [
        ...payments,
        ...[...deletions, ...heldJobs, ...leadRatings].sort(
            (a, b) => new Date(a.at ?? 0).getTime() - new Date(b.at ?? 0).getTime(),
        ),
    ];
}

/** Everything waiting for the super admin now. Payment problems only on their platform, where the keys are. */
export function useSuperAdminActions(): SuperAdminAction[] {
    const { jobs } = useAdminJobs();
    const { manufacturers } = useAdminManufacturers();
    const settings = useOptionalSuperAdminSettings();
    return getSuperAdminActions(jobs, manufacturers, settings?.apiKeys ?? null);
}
