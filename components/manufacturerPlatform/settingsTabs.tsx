"use client";

import type { ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type SettingsTab<T extends string> = {
    value: T;
    /** The tab's name, and its panel's heading. */
    label: string;
    /** For the mobile segmented control, where the full label doesn't fit. */
    shortLabel?: string;
    icon: LucideIcon;
    panel: ReactNode;
};

// ─────────────────────────────────────────────────────────────────────────────
// SettingsTabs — a settings page's layout: `header` (e.g. the avatar) with
// the section tabs under it — a vertical list on desktop, a segmented
// control on mobile — and the active section beside/below. Each section
// saves on its own. Panels stay mounted while hidden, so unsaved edits
// survive switching tabs. The manufacturer's and the admin's Settings.
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsTabs<T extends string>({
    header,
    tabs,
    defaultValue,
    label,
}: {
    /** Above the tabs, e.g. the avatar — divided from them on desktop. */
    header?: ReactNode;
    tabs: SettingsTab<T>[];
    defaultValue: T;
    /** Names the tab list for screen readers. */
    label: string;
}) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    return (
        <Tabs.Root
            defaultValue={defaultValue}
            orientation={isDesktop ? "vertical" : "horizontal"}
            className="flex flex-col gap-8 lg:flex-row lg:gap-0"
        >
            <div className="flex flex-col gap-6 lg:w-72 lg:shrink-0 lg:self-start lg:pr-10">
                {header}
                <Tabs.List
                    aria-label={label}
                    className={cn(
                        "grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-mist-100 p-1 lg:flex lg:flex-col lg:rounded-none lg:bg-transparent lg:p-0",
                        header && "lg:border-t lg:border-border lg:pt-6",
                    )}
                >
                    {tabs.map(({ value, label, shortLabel, icon: Icon }) => (
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
                {tabs.map((tab) => (
                    <Tabs.Panel
                        key={tab.value}
                        value={tab.value}
                        keepMounted
                        className="flex max-w-2xl flex-col gap-6 outline-none data-hidden:hidden"
                    >
                        <h2 className="text-lg font-semibold font-text text-mist-950">{tab.label}</h2>
                        {tab.panel}
                    </Tabs.Panel>
                ))}
            </div>
        </Tabs.Root>
    );
}
