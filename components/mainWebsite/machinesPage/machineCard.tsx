import Link from "next/link";
import HoverCard from "../common/hoverCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getMachineUrl } from "@/constant/navigation";
import type { MachineBookingUnit } from "@/lib/services/machineBookingService";
import type { WebsiteMachine } from "@/lib/services/websiteService";
import BookMachineTimeButton from "../servicesPage/bookMachineTimeButton";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import { MachinePhoto, MachinePrices, getMachineKind } from "./machineParts";

/** Functions listed on a card; the rest are on the machine's page. */
const CARD_FUNCTIONS = 3;

/**
 * A machine in the catalogue (and the Services page's preview): its photo,
 * kind, name and model, what it does, its prices, and the ways to book it
 * (with it picked) or see its page.
 */
export default function MachineCard({ machine, unit }: { machine: WebsiteMachine; unit: MachineBookingUnit }) {
    const href = getMachineUrl(machine.id);
    const kind = getMachineKind(machine);
    const extraFunctions = machine.functions.length - CARD_FUNCTIONS;

    return (
        <HoverCard as="article" className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-border bg-white transition-colors duration-300 hover:border-primary-300">
            <Link href={href} tabIndex={-1} aria-hidden>
                <MachinePhoto
                    machine={machine}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="aspect-4/3 w-full"
                />
            </Link>
            <div className="flex flex-1 flex-col gap-4 p-5 lg:p-6">
                <div className="flex flex-col gap-1.5">
                    {kind && <p className="text-sm font-medium text-primary-800 wrap-anywhere">{kind}</p>}
                    <h3 className="text-xl font-medium text-pretty wrap-anywhere">
                        <Link href={href} className="hover:text-primary-800">
                            {machine.name}
                        </Link>
                    </h3>
                    {machine.model && <p className="text-sm font-light text-mist-600 wrap-anywhere">{machine.model}</p>}
                </div>
                {machine.functions.length > 0 && (
                    <p className="text-sm font-light text-mist-700">
                        <span className="sr-only">What it does: </span>
                        {machine.functions.slice(0, CARD_FUNCTIONS).join(" · ")}
                        {extraFunctions > 0 && <span className="text-mist-500"> · +{extraFunctions} more</span>}
                    </p>
                )}
                <MachinePrices machine={machine} unit={unit} className="mt-auto" />
                <div className="flex flex-wrap items-center gap-2">
                    <BookMachineTimeButton
                        initialMachineIds={[machine.id]}
                        disabled={!machine.bookable}
                        className={cn(
                            WEBSITE_PRIMARY_BUTTON,
                            "cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-primary-950 disabled:hover:bg-primary-950 disabled:hover:text-mist-100",
                        )}
                    >
                        Book this machine
                    </BookMachineTimeButton>
                    <Link href={href} className={cn(WEBSITE_OUTLINE_BUTTON, "text-sm")} aria-label={`Details for ${machine.name}`}>
                        Details
                    </Link>
                </div>
                {!machine.bookable && (
                    <p className="-mt-2 text-xs font-light text-mist-600">Not offered by the {unit} right now.</p>
                )}
            </div>
        </HoverCard>
    );
}

export function MachineCardSkeleton() {
    return (
        <div aria-hidden className="flex h-full flex-col overflow-hidden rounded-[10px] border border-border bg-white">
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <div className="flex flex-col gap-4 p-5 lg:p-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-4 w-2/3" />
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

/** A grid of card skeletons, laid out like the cards. */
export function MachineGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: count }, (_, i) => (
                <MachineCardSkeleton key={i} />
            ))}
        </div>
    );
}
