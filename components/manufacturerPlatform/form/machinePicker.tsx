"use client";

import { Check, Cog } from "lucide-react";
import { ErrorIcon } from "@/components/form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, fromKobo } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { MachineBookingUnit, PublicMachine } from "@/lib/services/machineBookingService";

/**
 * The machines a booking is for: a grid of cards, each a checkbox (Tab to
 * reach it, Space to toggle it). Up to `max` can be picked; at the limit the
 * other cards are disabled until one is removed. Machines in
 * `initialMachineIds` (the one a visitor chose on the website) come first.
 */
export default function MachinePicker({
    machines,
    max,
    unit,
    value,
    onChange,
    onBlur,
    error,
    disabled = false,
    initialMachineIds,
}: {
    machines: PublicMachine[];
    max: number;
    unit: MachineBookingUnit;
    /** The picked machines' ids. */
    value: string[];
    onChange: (ids: string[]) => void;
    onBlur?: () => void;
    error?: string;
    disabled?: boolean;
    /** Machines the booking started with: listed first so they're in view. */
    initialMachineIds?: string[];
}) {
    const selected = value.filter((id) => machines.some((machine) => machine.id === id));
    const isFull = selected.length >= max;
    // Kept in the order the API lists them, apart from the ones the booking started with
    const listed = initialMachineIds?.length
        ? [
              ...machines.filter((machine) => initialMachineIds.includes(machine.id)),
              ...machines.filter((machine) => !initialMachineIds.includes(machine.id)),
          ]
        : machines;
    const toggle = (id: string) => {
        if (selected.includes(id)) onChange(selected.filter((item) => item !== id));
        else if (!isFull) onChange([...selected, id]);
    };

    return (
        <div
            role="group"
            aria-labelledby="machine-picker-label"
            aria-describedby="machine-picker-hint"
            className="flex min-w-0 flex-col gap-2"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span id="machine-picker-label" className="text-[#1F2937] text-sm font-medium font-text">
                    Machines<span className="ml-1 text-[#EF4444]" aria-hidden>*</span>
                </span>
                <span className="text-xs font-medium font-text text-mist-700" aria-live="polite">
                    {selected.length} of {max} selected
                </span>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {listed.map((machine) => {
                    const isSelected = selected.includes(machine.id);
                    const isDisabled = disabled || (!isSelected && isFull);
                    const kind = [machine.category, machine.type].filter(Boolean).join(", ");
                    return (
                        <li key={machine.id} className="min-w-0">
                            <label
                                className={cn(
                                    "relative flex h-full gap-3 rounded-lg border p-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-secondary-300",
                                    isSelected
                                        ? "border-secondary-700 bg-secondary-50/60"
                                        : "border-gray-200 bg-white hover:border-mist-300",
                                    isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => toggle(machine.id)}
                                    onBlur={onBlur}
                                    aria-describedby={`machine-${machine.id}-details`}
                                />
                                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mist-100">
                                    {machine.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element -- a photo from the media host, no fixed size
                                        <img src={machine.imageUrl} alt="" className="size-full object-cover" />
                                    ) : (
                                        <Cog className="size-6 text-mist-400" strokeWidth={1.5} aria-hidden />
                                    )}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-6 font-text">
                                    <span className="text-sm font-semibold text-mist-950 wrap-anywhere">{machine.name}</span>
                                    <span id={`machine-${machine.id}-details`} className="flex flex-col gap-0.5">
                                        {(machine.model || kind) && (
                                            <span className="text-xs text-mist-600 wrap-anywhere">
                                                {[machine.model, kind].filter(Boolean).join(" | ")}
                                            </span>
                                        )}
                                        {machine.functions.length > 0 && (
                                            <span className="line-clamp-2 text-xs text-mist-500">{machine.functions.join(", ")}</span>
                                        )}
                                        <span className="mt-1 text-sm font-medium text-mist-950">
                                            {formatPrice(fromKobo(machine.priceKobo))}{" "}
                                            <span className="text-xs font-normal text-mist-600">per {unit}</span>
                                        </span>
                                    </span>
                                </span>
                                <span
                                    aria-hidden
                                    className={cn(
                                        "absolute top-3 right-3 flex size-5 items-center justify-center rounded border",
                                        isSelected ? "border-secondary-700 bg-secondary-700 text-white" : "border-gray-300 bg-white",
                                    )}
                                >
                                    {isSelected && <Check className="size-3.5" strokeWidth={2.5} />}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
            {error ? (
                <span id="machine-picker-hint" className="flex items-center gap-1 text-xs font-normal font-text text-[#EF4444]">
                    <ErrorIcon />
                    {error}
                </span>
            ) : (
                <span id="machine-picker-hint" className="text-[#9CA3AF] text-xs font-normal font-text">
                    {isFull && machines.length > max
                        ? `That's the most machines for one booking (${max}). Remove one to pick another.`
                        : `Pick up to ${max} machine${max === 1 ? "" : "s"}. Each one is charged per ${unit}.`}
                </span>
            )}
        </div>
    );
}

/** The picker while the machines load: its label shows, the cards are skeletons. */
export function MachinePickerSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[#1F2937] text-sm font-medium font-text">Machines</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1].map((key) => (
                    <div key={key} className="flex gap-3 rounded-lg border border-gray-200 p-3">
                        <Skeleton className="size-16 shrink-0 rounded-md" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
