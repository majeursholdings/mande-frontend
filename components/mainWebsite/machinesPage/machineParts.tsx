import Image from "next/image";
import { Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { MachineBookingUnit } from "@/lib/services/machineBookingService";
import type { WebsiteMachine } from "@/lib/services/websiteService";

// Pieces shared by the machine cards and a machine's own page.

/** "Cutting, CNC": what kind of machine it is. */
export const getMachineKind = (machine: Pick<WebsiteMachine, "category" | "type">) =>
    [machine.category, machine.type].filter(Boolean).join(", ");

/** Why a machine can't be booked now, for the note beside its disabled button. */
export const getNotBookableNote = (unit: MachineBookingUnit) =>
    `Bookings are by the ${unit} right now, and this machine isn't offered by the ${unit}.`;

/**
 * The machine's photo, or, without one, a quiet panel with a cog in the
 * site's green: the frame is the caller's (`className` sets its size).
 */
export function MachinePhoto({
    machine,
    sizes,
    priority = false,
    className,
}: {
    machine: Pick<WebsiteMachine, "name" | "imageUrl">;
    sizes: string;
    priority?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("relative overflow-hidden bg-mist-200", className)}>
            {machine.imageUrl ? (
                <Image
                    src={machine.imageUrl}
                    alt={machine.name}
                    fill
                    sizes={sizes}
                    priority={priority}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            ) : (
                <div
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,var(--color-mist-100)_0,var(--color-mist-200)_70%)]"
                >
                    <span className="flex size-16 items-center justify-center rounded-full border border-primary-200 bg-white/70 text-primary-800">
                        <Cog className="size-8" strokeWidth={1.25} />
                    </span>
                </div>
            )}
        </div>
    );
}

/** The price per hour and per day, side by side; "Not offered" where there's none. */
export function MachinePrices({
    machine,
    unit,
    size = "sm",
    className,
}: {
    machine: Pick<WebsiteMachine, "hourlyPriceKobo" | "dailyPriceKobo">;
    /** The unit bookings are made by now: its price is marked. */
    unit: MachineBookingUnit;
    size?: "sm" | "lg";
    className?: string;
}) {
    const prices: { unit: MachineBookingUnit; label: string; kobo: number | null }[] = [
        { unit: "hour", label: "Per hour", kobo: machine.hourlyPriceKobo },
        { unit: "day", label: "Per day", kobo: machine.dailyPriceKobo },
    ];
    return (
        <dl className={cn("grid grid-cols-2 gap-3", className)}>
            {prices.map((price) => (
                <div
                    key={price.unit}
                    className={cn(
                        "flex min-w-0 flex-col gap-0.5 rounded-lg border px-3 py-2",
                        price.unit === unit && price.kobo !== null
                            ? "border-primary-300 bg-primary-50"
                            : "border-border bg-white",
                        size === "lg" && "px-4 py-3",
                    )}
                >
                    <dt className="text-xs font-light text-mist-600">{price.label}</dt>
                    <dd
                        className={cn(
                            price.kobo === null ? "font-light text-mist-500" : "font-medium text-mist-950",
                            size === "lg" ? "text-xl" : "text-base",
                        )}
                    >
                        {price.kobo === null ? "Not offered" : formatPrice(fromKobo(price.kobo))}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
