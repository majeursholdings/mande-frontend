"use client";

import { Fragment, type ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** A part of a tab, picked from a sub menu under it. */
export type SettingsSubTab = { value: string; label: string };

export type SettingsTab<T extends string> = {
    value: T;
    /** The tab's name, and its panel's heading. */
    label: string;
    /** For the mobile segmented control, where the full label doesn't fit. */
    shortLabel?: string;
    icon: LucideIcon;
    panel: ReactNode;
    /** A sub menu of the tab's parts: nested under it on desktop, pills above its panel on mobile. */
    subTabs?: SettingsSubTab[];
};

// ─────────────────────────────────────────────────────────────────────────────
// SettingsTabs — a settings page's layout: `header` (e.g. the avatar) with
// the section tabs under it — a vertical list on desktop, a segmented
// control on mobile — and the active section beside/below. Each section
// saves on its own. Panels stay mounted while hidden, so unsaved edits
// survive switching tabs. A tab with subTabs gets a sub menu, picked with
// subValue/onSubValueChange. The manufacturer's and the admin's Settings.
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsTabs<T extends string>({
    header,
    tabs,
    defaultValue,
    value,
    onValueChange,
    subValue,
    onSubValueChange,
    label,
}: {
    /** Above the tabs, e.g. the avatar — divided from them on desktop. */
    header?: ReactNode;
    tabs: SettingsTab<T>[];
    defaultValue?: T;
    value?: T;
    onValueChange?: (value: T) => void;
    /** The open part of the active tab, when it has subTabs. */
    subValue?: string;
    /** Opens a part of a tab, switching to that tab too. */
    onSubValueChange?: (tab: T, subValue: string) => void;
    /** Names the tab list for screen readers. */
    label: string;
}) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    return (
        <Tabs.Root
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => onValueChange?.(next as T)}
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
                    {tabs.map(({ value: tabValue, label, shortLabel, icon: Icon, subTabs }) => (
                        <Fragment key={tabValue}>
                            <Tabs.Tab
                                value={tabValue}
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
                            {isDesktop && subTabs && value === tabValue && (
                                <SubMenu
                                    label={`${label} sections`}
                                    subTabs={subTabs}
                                    value={subValue}
                                    onSelect={(next) => onSubValueChange?.(tabValue, next)}
                                    className="flex flex-col gap-0.5 pb-1"
                                    itemClassName="rounded-lg py-2 pr-3 pl-11 text-left text-sm data-[active=true]:bg-mist-100 data-[active=true]:text-mist-950"
                                />
                            )}
                        </Fragment>
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
                        {!isDesktop && tab.subTabs && (
                            <SubMenu
                                label={`${tab.label} sections`}
                                subTabs={tab.subTabs}
                                value={subValue}
                                onSelect={(next) => onSubValueChange?.(tab.value, next)}
                                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                                itemClassName="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs data-[active=true]:border-secondary-200"
                            />
                        )}
                        {tab.panel}
                    </Tabs.Panel>
                ))}
            </div>
        </Tabs.Root>
    );
}

/** A tab's sub menu: the active part marked as current. */
function SubMenu({
    label,
    subTabs,
    value,
    onSelect,
    className,
    itemClassName,
}: {
    label: string;
    subTabs: SettingsSubTab[];
    value?: string;
    onSelect: (value: string) => void;
    className?: string;
    itemClassName?: string;
}) {
    const current = subTabs.some((item) => item.value === value) ? value : subTabs[0]?.value;
    return (
        <nav aria-label={label}>
            <ul className={className}>
                {subTabs.map((item) => {
                    const isActive = item.value === current;
                    return (
                        <li key={item.value} className="flex">
                            <button
                                type="button"
                                aria-current={isActive ? "true" : undefined}
                                data-active={isActive}
                                onClick={() => onSelect(item.value)}
                                className={cn(
                                    "w-full cursor-pointer font-medium font-text text-mist-600 outline-none transition-colors duration-200 hover:bg-mist-50 hover:text-mist-900 focus-visible:ring-2 focus-visible:ring-secondary-300",
                                    "data-[active=true]:bg-secondary-50 data-[active=true]:text-secondary-700",
                                    itemClassName,
                                )}
                            >
                                {item.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
