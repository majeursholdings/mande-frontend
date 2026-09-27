"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ResponsiveTab<T extends string> = {
    value: T;
    label: string;
    panel: ReactNode;
};

const LIST_CLASS = {
    // A row over a divider, the active one bold with a bar under it
    underline: "border-b border-border",
    // A pill-shaped control, the active one raised
    segmented: "w-fit gap-1 rounded-lg bg-mist-100 p-1",
} as const;

const TAB_CLASS = {
    underline:
        "relative px-4 py-4 text-[15px] font-medium text-mist-500 hover:bg-mist-100/70 focus-visible:bg-mist-100 data-active:font-bold data-active:text-mist-950 data-active:after:absolute data-active:after:bottom-0 data-active:after:left-1/2 data-active:after:h-1 data-active:after:w-14 data-active:after:-translate-x-1/2 data-active:after:rounded-full data-active:after:bg-secondary-700",
    segmented:
        "rounded-md px-5 py-2 text-sm font-medium text-mist-600 focus-visible:ring-2 focus-visible:ring-secondary-300 data-active:bg-white data-active:text-secondary-700 data-active:shadow-sm",
} as const;

// The dropdown that stands in below md — tinted like the segmented control, so
// sections inside a panel read as nested under the page's own
const TRIGGER_CLASS = {
    underline: "border-border bg-white",
    segmented: "border-transparent bg-mist-100",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ResponsiveTabs — sections that fit any width. From md up, a tab row (or a
// segmented control) sized to its labels, which scrolls sideways if it ever
// runs out of room. Below md, where a row of tabs gets cramped, a dropdown
// of the sections — the phone's own picker. Every panel stays mounted, so
// what's been done in one (a filter, a sort) survives switching away.
// ─────────────────────────────────────────────────────────────────────────────

export default function ResponsiveTabs<T extends string>({
    tabs,
    defaultValue,
    label,
    variant = "underline",
    className,
}: {
    tabs: ResponsiveTab<T>[];
    defaultValue: T;
    /** Names the sections for screen readers — the tab row and the dropdown. */
    label: string;
    /** "underline" for a page's sections, "segmented" for sections inside a panel. */
    variant?: keyof typeof LIST_CLASS;
    className?: string;
}) {
    const [value, setValue] = useState<T>(defaultValue);
    const items = tabs.map((tab) => ({ value: tab.value, label: tab.label }));

    return (
        <Tabs.Root
            value={value}
            onValueChange={(next) => setValue(next as T)}
            className={cn("flex flex-col gap-6", className)}
        >
            <div className="md:hidden">
                <Select<string, false> items={items} value={value} onValueChange={(next) => next && setValue(next as T)}>
                    <SelectTrigger
                        aria-label={label}
                        className={cn(
                            "h-11 w-full rounded-lg px-3.5 font-text text-sm font-medium text-mist-950 data-[size=default]:h-11",
                            TRIGGER_CLASS[variant],
                        )}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="font-text text-sm">
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs.List
                aria-label={label}
                className={cn(
                    "hidden overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden",
                    LIST_CLASS[variant],
                )}
            >
                {tabs.map((tab) => (
                    <Tabs.Tab
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                            "shrink-0 whitespace-nowrap font-text outline-none transition-colors duration-200 cursor-pointer",
                            TAB_CLASS[variant],
                        )}
                    >
                        {tab.label}
                    </Tabs.Tab>
                ))}
            </Tabs.List>

            {tabs.map((tab) => (
                <Tabs.Panel key={tab.value} value={tab.value} keepMounted className="outline-none data-hidden:hidden">
                    {tab.panel}
                </Tabs.Panel>
            ))}
        </Tabs.Root>
    );
}
