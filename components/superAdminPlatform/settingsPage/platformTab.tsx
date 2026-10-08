"use client";

import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import JobPaymentsForm, { JobPaymentsFormSkeleton } from "../form/jobPaymentsForm";
import JobRulesForm, { JobRulesFormSkeleton } from "../form/jobRulesForm";
import PointAllocationForm from "../form/pointAllocationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/adminPlatform/emptyState";
import { useSuperAdminSettings } from "../settingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// PlatformTab — the rules the whole platform runs on: how a job's amount is
// paid out, the limits every job works within, and whether manufacturers can
// sign up. Each section saves on its own, and is opened from the Platform
// sub menu; the others stay mounted (hidden) so unsaved edits survive.
// ─────────────────────────────────────────────────────────────────────────────

/** The Platform tab's sub menu, in order. */
export const PLATFORM_SECTIONS = [
    { value: "job-payments", label: "Job payments" },
    { value: "job-rules", label: "Job rules" },
    { value: "points", label: "Point allocations" },
    { value: "sign-ups", label: "Manufacturer sign-ups" },
] as const;

export type PlatformSection = (typeof PLATFORM_SECTIONS)[number]["value"];

export default function PlatformTab({ section }: { section: PlatformSection }) {
    const { platformSettings, updatePlatformSettings, sectionStatus } = useSuperAdminSettings();
    const { isLoading } = sectionStatus.platformSettings;

    if (!platformSettings && !isLoading) {
        return <LoadError message="We couldn't load the platform rules. Please refresh the page." />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div hidden={section !== "job-payments"}>
                <SettingsSection
                    headingLevel="h3"
                    title="Job payments"
                    description="A job's amount is paid in parts as the work moves. Changes apply to jobs created from now on."
                >
                    {platformSettings ? (
                        <JobPaymentsForm settings={platformSettings} onSave={updatePlatformSettings} />
                    ) : (
                        <JobPaymentsFormSkeleton />
                    )}
                </SettingsSection>
            </div>

            <div hidden={section !== "job-rules"}>
                <SettingsSection headingLevel="h3" title="Job rules" description="The limits every job works within.">
                    {platformSettings ? (
                        <JobRulesForm settings={platformSettings} onSave={updatePlatformSettings} />
                    ) : (
                        <JobRulesFormSkeleton />
                    )}
                </SettingsSection>
            </div>

            <div hidden={section !== "points"}>
                <SettingsSection
                    headingLevel="h3"
                    title="Point allocations"
                    description="Control how many points are awarded or deducted for each activity across manufacturers and project leads."
                >
                    {platformSettings ? (
                        <PointAllocationForm initialSettings={platformSettings.pointSettings} onSave={updatePlatformSettings} />
                    ) : (
                        <JobRulesFormSkeleton />
                    )}
                </SettingsSection>
            </div>

            <div hidden={section !== "sign-ups"}>
                <SettingsSection
                    headingLevel="h3"
                    title="Manufacturer sign-ups"
                    description="Close them to stop new manufacturers joining, e.g. while there's more work than the team can check. Everyone already on the platform carries on."
                    action={
                        !platformSettings ? (
                            <Skeleton className="h-5 w-9 rounded-full" />
                        ) : (
                            <Switch
                                aria-label="Manufacturers can sign up"
                                checked={platformSettings.manufacturerSignUpsOpen}
                                onCheckedChange={async (checked) => {
                                    try {
                                        await updatePlatformSettings({
                                            manufacturerSignUpsOpen: checked,
                                        });
                                        toast.success(checked ? "Manufacturer sign-ups are open" : "Manufacturer sign-ups are closed");
                                    } catch (err) {
                                        toast.error(getErrorMessage(err, "Couldn't change sign-ups. Please try again."));
                                    }
                                }}
                            />
                        )
                    }
                >
                    {!platformSettings ? (
                        <Skeleton className="h-5 w-64" />
                    ) : (
                        <p className="text-sm font-text text-mist-700">
                            {platformSettings.manufacturerSignUpsOpen
                                ? "Open: new manufacturers can sign up."
                                : "Closed: the sign-up page tells new manufacturers to check back later."}
                        </p>
                    )}
                </SettingsSection>
            </div>
        </div>
    );
}
