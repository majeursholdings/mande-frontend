"use client";

import { KeyRound, SlidersHorizontal, Tags, UsersRound } from "lucide-react";
import SettingsTabs, { type SettingsTab } from "@/components/manufacturerPlatform/settingsTabs";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import ApiKeysTab from "./apiKeysTab";
import PlansTab from "./plansTab";
import PlatformTab from "./platformTab";
import SuperAdminsTab from "./superAdminsTab";

type SettingsTabValue = "super-admins" | "plans" | "platform" | "api-keys";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminSettingsPage — running the platform, in the admin Settings'
// layout: who else is a super admin, what the plans cost and include, the
// rules every job follows, and the API keys for the platforms Mande connects
// to (payments for now). API keys are only for owners and tech support, so
// a manager doesn't get that tab (and ?tab=api-keys opens the first one).
// Their own details are under Profile › Edit profile.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminSettingsPage({ initialTab }: { initialTab?: string }) {
    const { permissions } = useStaffPlatform();
    const tabs: SettingsTab<SettingsTabValue>[] = [
        { value: "super-admins", label: "Super admins", shortLabel: "Admins", icon: UsersRound, panel: <SuperAdminsTab /> },
        { value: "plans", label: "Plans", icon: Tags, panel: <PlansTab /> },
        { value: "platform", label: "Platform", icon: SlidersHorizontal, panel: <PlatformTab /> },
        ...(permissions.managesApiKeys
            ? [{ value: "api-keys" as const, label: "API keys", icon: KeyRound, panel: <ApiKeysTab /> }]
            : []),
    ];
    // e.g. ?tab=api-keys
    const defaultTab = tabs.find((tab) => tab.value === initialTab)?.value ?? tabs[0].value;

    return (
        <div className="flex flex-col gap-6 lg:gap-10">
            <AdminPageHeader
                title="Settings"
                description={
                    permissions.managesApiKeys
                        ? "Run the platform: who else can, what the plans cost, the rules every job follows, and the platforms it connects to."
                        : "Run the platform: who else can, what the plans cost and the rules every job follows."
                }
            />
            <SettingsTabs label="Settings sections" tabs={tabs} defaultValue={defaultTab} />
        </div>
    );
}
