"use client";

import type { ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { Building2, CreditCard, UserRound, type LucideIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ProfileAvatarUploadForm from "@/components/manufacturerPlatform/form/profileAvatarUploadForm";
import ProfileBasicInfoForm from "@/components/manufacturerPlatform/form/profileBasicInfoForm";
import ProfileAboutCompanyForm from "@/components/manufacturerPlatform/form/profileAboutCompanyForm";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import PageHeader from "../pageHeader";
import IdentityVerification from "./identityVerification";
import PlanTab from "./planTab";

type SettingsTab = "basic-info" | "about-company" | "plan";

const TABS: {
    value: SettingsTab;
    label: string;
    /** For the mobile segmented control, where the full label doesn't fit. */
    shortLabel?: string;
    icon: LucideIcon;
}[] = [
    { value: "basic-info", label: "Basic Info", icon: UserRound },
    { value: "about-company", label: "About Company", shortLabel: "Company", icon: Building2 },
    { value: "plan", label: "Plan", icon: CreditCard },
];

// ─────────────────────────────────────────────────────────────────────────────
// Settings — avatar with the section tabs under it (a vertical list on
// desktop, a segmented control on mobile), the active section beside/below.
// Each section saves on its own. Panels stay mounted while hidden, so unsaved
// edits survive switching tabs.
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturerSettingsPage({ initialTab }: { initialTab?: string }) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    // e.g. ?tab=plan from an "Upgrade" link
    const defaultTab = TABS.find((tab) => tab.value === initialTab)?.value ?? TABS[0].value;

    return (
        <div className="flex flex-col gap-6 lg:gap-10">
            <PageHeader title="Settings" backLink={MANUFACTURER_PROFILE_BACK_LINK} />

            <Tabs.Root
                defaultValue={defaultTab}
                orientation={isDesktop ? "vertical" : "horizontal"}
                className="flex flex-col gap-8 lg:flex-row lg:gap-0"
            >
                <div className="flex flex-col gap-6 lg:w-72 lg:shrink-0 lg:self-start lg:pr-10">
                    <ProfileAvatarUploadForm />
                    <Tabs.List
                        aria-label="Profile sections"
                        className="grid grid-cols-3 gap-1 rounded-lg bg-mist-100 p-1 lg:flex lg:flex-col lg:rounded-none lg:bg-transparent lg:border-t lg:border-border lg:p-0 lg:pt-6"
                    >
                        {TABS.map(({ value, label, shortLabel, icon: Icon }) => (
                            <Tabs.Tab
                                key={value}
                                value={value}
                                // The full name, even where only the short label shows
                                aria-label={label}
                                className="flex items-center justify-center gap-3 rounded-md px-2 py-2 text-xs font-medium font-text text-mist-600 outline-none transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-secondary-300 data-active:bg-white data-active:text-secondary-700 data-active:shadow-sm sm:text-sm lg:justify-start lg:rounded-lg lg:px-3 lg:py-2.5 lg:not-data-active:hover:bg-mist-50 lg:not-data-active:hover:text-mist-900 lg:data-active:bg-secondary-50 lg:data-active:shadow-none"
                            >
                                <Icon className="hidden size-5 shrink-0 lg:block" strokeWidth={1.75} />
                                {shortLabel ? (
                                    <>
                                        <span className="lg:hidden">{shortLabel}</span>
                                        <span className="hidden lg:inline">{label}</span>
                                    </>
                                ) : (
                                    label
                                )}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </div>

                <div className="min-w-0 flex-1 lg:border-l lg:border-border lg:pl-10">
                    <TabPanel value="basic-info" title="Basic Info">
                        <ProfileBasicInfoForm />
                        <IdentityVerification />
                    </TabPanel>
                    <TabPanel value="about-company" title="About Company">
                        <ProfileAboutCompanyForm />
                    </TabPanel>
                    <TabPanel value="plan" title="Plan">
                        <PlanTab />
                    </TabPanel>
                </div>
            </Tabs.Root>
        </div>
    );
}

function TabPanel({
    value,
    title,
    children,
}: {
    value: SettingsTab;
    title: string;
    children: ReactNode;
}) {
    return (
        <Tabs.Panel
            value={value}
            keepMounted
            className="flex max-w-2xl flex-col gap-6 outline-none data-hidden:hidden"
        >
            <h2 className="text-lg font-semibold font-text text-mist-950">{title}</h2>
            {children}
        </Tabs.Panel>
    );
}
