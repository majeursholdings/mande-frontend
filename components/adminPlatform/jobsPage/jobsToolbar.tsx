"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import UserAvatar from "@/components/ui/userAvatar";
import {
    ADMIN_JOBS_VIEW_OPTIONS,
    PROJECT_LEADS,
    getProjectLead,
    type AdminJobsView,
} from "@/constant/admin";

const STACK_SIZE = 4;

const MENU_ITEM_CLASS =
    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-text transition-colors cursor-pointer";

export type JobsFilters = {
    search: string;
    assignedToMe: boolean;
    /** A PROJECT_LEADS id, or null for everyone's jobs. */
    leadId: string | null;
    view: AdminJobsView;
};

/**
 * Search, the "Jobs assigned to me" smart filter (for someone who leads
 * jobs), a filter by project lead (the avatar stack) and the Sort by menu.
 * On phones: search and sort on one row, the smart filter under them.
 */
export default function JobsToolbar({
    filters,
    onChange,
    showAssignedToMe = true,
}: {
    filters: JobsFilters;
    onChange: (changes: Partial<JobsFilters>) => void;
    showAssignedToMe?: boolean;
}) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center justify-between gap-3 md:contents">
                <label className="relative flex min-w-0 flex-1 items-center md:w-65 md:flex-none">
                    <span className="sr-only">Search by job name</span>
                    <Search className="pointer-events-none absolute left-3 size-4 text-mist-400" />
                    <input
                        type="search"
                        value={filters.search}
                        onChange={(event) => onChange({ search: event.target.value })}
                        placeholder="Search by job name"
                        className="h-9 w-full rounded-lg border border-border bg-white pr-3 pl-9 text-sm font-text text-mist-900 placeholder:text-mist-400 outline-none transition-colors focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100"
                    />
                </label>
                <div className="md:order-last md:ml-auto">
                    <SortMenu value={filters.view} onChange={(view) => onChange({ view })} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {showAssignedToMe && (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-text text-mist-900">Smart filter:</span>
                    <button
                        type="button"
                        aria-pressed={filters.assignedToMe}
                        onClick={() => onChange({ assignedToMe: !filters.assignedToMe })}
                        className={cn(
                            "rounded-md border px-3 py-1.5 text-sm font-text transition-colors cursor-pointer",
                            filters.assignedToMe
                                ? "border-error-300 bg-error-50/50 text-error-600"
                                : "border-border text-mist-600 hover:border-mist-300 hover:text-mist-900",
                        )}
                    >
                        Jobs assigned to me
                    </button>
                </div>
                )}
                <LeadFilter value={filters.leadId} onChange={(leadId) => onChange({ leadId })} />
            </div>
        </div>
    );
}

/** The avatar stack — opens a list to show just one project lead's jobs. */
function LeadFilter({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (leadId: string | null) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = value ? getProjectLead(value) : undefined;
    // The chosen lead leads the stack
    const stack = selected
        ? [selected, ...PROJECT_LEADS.filter((lead) => lead.id !== selected.id)]
        : PROJECT_LEADS;
    const hiddenCount = Math.max(0, stack.length - STACK_SIZE);

    const choose = (leadId: string | null) => {
        onChange(leadId);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
                aria-label={selected ? `Project lead: ${selected.name}` : "Filter by project lead"}
                className={cn(
                    "flex items-center rounded-full p-0.5 transition-shadow cursor-pointer",
                    selected && "ring-2 ring-secondary-300",
                )}
            >
                {stack.slice(0, STACK_SIZE).map((lead, index) => (
                    <UserAvatar
                        key={lead.id}
                        name={lead.name}
                        src={lead.avatarUrl}
                        className={cn("size-8 text-xs ring-2 ring-white", index > 0 && "-ml-2")}
                    />
                ))}
                {hiddenCount > 0 && (
                    <span className="-ml-2 flex size-8 items-center justify-center rounded-full bg-mist-100 text-xs font-medium font-text text-mist-600 ring-2 ring-white">
                        +{hiddenCount}
                    </span>
                )}
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={8} className="w-60 gap-0.5 p-1.5">
                <p className="px-3 pt-1.5 pb-1 text-xs font-medium font-text text-mist-500">Project lead</p>
                <button
                    type="button"
                    onClick={() => choose(null)}
                    className={cn(MENU_ITEM_CLASS, value === null ? "bg-secondary-50 text-secondary-700" : "text-mist-700 hover:bg-mist-50")}
                >
                    <span className="flex-1">Everyone</span>
                    {value === null && <Check className="size-4" />}
                </button>
                {PROJECT_LEADS.map((lead) => (
                    <button
                        key={lead.id}
                        type="button"
                        onClick={() => choose(lead.id)}
                        className={cn(
                            MENU_ITEM_CLASS,
                            value === lead.id ? "bg-secondary-50 text-secondary-700" : "text-mist-700 hover:bg-mist-50",
                        )}
                    >
                        <UserAvatar name={lead.name} src={lead.avatarUrl} className="size-6 text-[10px]" />
                        <span className="flex-1 truncate">{lead.name}</span>
                        {value === lead.id && <Check className="size-4" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}

/** "Sort by: All ⌄" — sort orders and status filters, as in the design. */
function SortMenu({ value, onChange }: { value: AdminJobsView; onChange: (view: AdminJobsView) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const label = ADMIN_JOBS_VIEW_OPTIONS.find((option) => option.value === value)?.label ?? "All";

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-text whitespace-nowrap transition-colors hover:border-mist-300 cursor-pointer">
                <span className="text-mist-400">Sort by:</span>
                <span className="text-mist-900">{label}</span>
                <ChevronDown className={cn("size-4 text-mist-700 transition-transform", isOpen && "rotate-180")} />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-44 gap-0.5 p-1.5">
                {ADMIN_JOBS_VIEW_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        className={cn(
                            MENU_ITEM_CLASS,
                            option.value === value ? "bg-mist-50 text-error-600" : "text-mist-700 hover:bg-mist-50",
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
