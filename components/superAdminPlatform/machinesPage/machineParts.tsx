"use client";

import { ImageIcon } from "lucide-react";
import { StatusBadge, type ColumnDef, type SelectFilterItem } from "@/components/customTable";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { Machine, MachineStatusFilter } from "@/lib/services/machineService";

const STATUS_LABELS: Record<MachineStatusFilter, string> = { active: "Active", inactive: "Inactive" };

/** The status filter's choices (what the API filters by). */
export const MACHINE_STATUS_ITEMS: SelectFilterItem[] = (["active", "inactive"] as MachineStatusFilter[]).map((status) => ({
    label: STATUS_LABELS[status],
    value: status,
}));

function Price({ kobo }: { kobo: number | null }) {
    if (kobo === null) return <span className="whitespace-nowrap text-mist-500">Not offered</span>;
    return <span className="whitespace-nowrap">{formatPrice(fromKobo(kobo))}</span>;
}

/** A small square photo, or a placeholder icon when there isn't one. */
export function MachineThumb({ url, className }: { url: string | null | undefined; className?: string }) {
    return (
        <span
            className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-mist-50 ${className ?? ""}`}
        >
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- an uploaded photo from the media host
                <img src={url} alt="" className="size-full object-cover" />
            ) : (
                <ImageIcon className="size-4 text-mist-300" strokeWidth={1.5} aria-hidden />
            )}
        </span>
    );
}

export const MACHINE_COLUMNS: ColumnDef<Machine>[] = [
    {
        key: "image",
        header: "Image",
        cell: (machine) => <MachineThumb url={machine.image?.url} />,
    },
    {
        key: "name",
        header: "Machine",
        cell: (machine) => (
            <div className="flex min-w-0 flex-col">
                <span className="font-medium text-mist-950 whitespace-nowrap">{machine.name}</span>
                {machine.model && <span className="max-w-56 truncate text-xs text-mist-500">{machine.model}</span>}
            </div>
        ),
    },
    {
        key: "category",
        header: "Category",
        cell: (machine) => <span className="whitespace-nowrap">{machine.category}</span>,
    },
    {
        key: "type",
        header: "Type",
        cell: (machine) => <span className="whitespace-nowrap">{machine.type ?? "-"}</span>,
    },
    {
        key: "hourly",
        header: "Per hour",
        cell: (machine) => <Price kobo={machine.hourlyPriceKobo} />,
    },
    {
        key: "daily",
        header: "Per day",
        cell: (machine) => <Price kobo={machine.dailyPriceKobo} />,
    },
    {
        key: "functions",
        header: "Functions",
        cell: (machine) => {
            const list = machine.functions.join(", ");
            return (
                <span className="block max-w-60 truncate" title={list}>
                    {list}
                </span>
            );
        },
    },
    {
        key: "status",
        header: "Status",
        cell: (machine) => (
            <StatusBadge
                label={machine.active ? "Active" : "Inactive"}
                tone={machine.active ? "green" : "gray"}
                variant="pill"
            />
        ),
    },
];
