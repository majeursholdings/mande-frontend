"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import JobPaymentsForm from "../form/jobPaymentsForm";
import JobRulesForm from "../form/jobRulesForm";
import { useSuperAdminSettings } from "../settingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// PlatformTab — the rules the whole platform runs on: how a job's amount is
// paid out, the limits every job works within, and whether manufacturers can
// sign up. Each section saves on its own.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlatformTab() {
    const { platformSettings, updatePlatformSettings } = useSuperAdminSettings();

    return (
        <div className="flex flex-col gap-6">
            <SettingsSection
                headingLevel="h3"
                title="Job payments"
                description="A job's amount is paid in parts as the work moves. Changes apply to jobs created from now on."
            >
                <JobPaymentsForm settings={platformSettings} onSave={updatePlatformSettings} />
            </SettingsSection>

            <SettingsSection
                headingLevel="h3"
                title="Job rules"
                description="The limits every job works within."
            >
                <JobRulesForm settings={platformSettings} onSave={updatePlatformSettings} />
            </SettingsSection>

            <SettingsSection
                headingLevel="h3"
                title="Manufacturer sign-ups"
                description="Close them to stop new manufacturers joining, e.g. while there's more work than the team can check. Everyone already on the platform carries on."
                action={
                    <Switch
                        aria-label="Manufacturers can sign up"
                        checked={platformSettings.manufacturerSignUpsOpen}
                        onCheckedChange={(checked) => {
                            try {
                                updatePlatformSettings({ manufacturerSignUpsOpen: checked });
                                toast.success(checked ? "Manufacturer sign-ups are open" : "Manufacturer sign-ups are closed");
                            } catch {
                                toast.error("Couldn't change sign-ups. Please try again.");
                            }
                        }}
                    />
                }
            >
                <p className="text-sm font-text text-mist-700">
                    {platformSettings.manufacturerSignUpsOpen
                        ? "Open: new manufacturers can sign up."
                        : "Closed: the sign-up page tells new manufacturers to check back later."}
                </p>
            </SettingsSection>
        </div>
    );
}
