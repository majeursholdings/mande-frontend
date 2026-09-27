"use client";

import { Building2, CreditCard, UserRound } from "lucide-react";
import ProfileAvatarUploadForm from "@/components/manufacturerPlatform/form/profileAvatarUploadForm";
import ProfileBasicInfoForm from "@/components/manufacturerPlatform/form/profileBasicInfoForm";
import ProfileAboutCompanyForm from "@/components/manufacturerPlatform/form/profileAboutCompanyForm";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import PageHeader from "../pageHeader";
import SettingsTabs, { type SettingsTab } from "../settingsTabs";
import IdentityVerification from "./identityVerification";
import PlanTab from "./planTab";

type SettingsTabValue = "basic-info" | "about-company" | "plan";

const TABS: SettingsTab<SettingsTabValue>[] = [
    {
        value: "basic-info",
        label: "Basic Info",
        icon: UserRound,
        panel: (
            <>
                <ProfileBasicInfoForm />
                <IdentityVerification />
            </>
        ),
    },
    {
        value: "about-company",
        label: "About Company",
        shortLabel: "Company",
        icon: Building2,
        panel: <ProfileAboutCompanyForm />,
    },
    { value: "plan", label: "Plan", icon: CreditCard, panel: <PlanTab /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Settings — the avatar with the section tabs under it (see SettingsTabs):
// basic info and identity verification, the company, and the plan.
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturerSettingsPage({ initialTab }: { initialTab?: string }) {
    // e.g. ?tab=plan from an "Upgrade" link
    const defaultTab = TABS.find((tab) => tab.value === initialTab)?.value ?? TABS[0].value;

    return (
        <div className="flex flex-col gap-6 lg:gap-10">
            <PageHeader title="Settings" backLink={MANUFACTURER_PROFILE_BACK_LINK} />
            <SettingsTabs
                label="Profile sections"
                header={<ProfileAvatarUploadForm />}
                tabs={TABS}
                defaultValue={defaultTab}
            />
        </div>
    );
}
