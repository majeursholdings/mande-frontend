import { Suspense } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MACHINES_URL, SERVICES_URL, getMachinesListUrl } from "@/constant/navigation";
import { getWebsiteMachines } from "@/lib/services/websiteService";
import CtaBand from "../common/ctaBand";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import BookMachineTimeButton from "../servicesPage/bookMachineTimeButton";
import MachineCard, { MachineGridSkeleton } from "./machineCard";

// ─────────────────────────────────────────────────────────────────────────────
// Machines: the factory's machine catalogue, open to every maker. A row of
// category tabs (links with ?category=), the machines as cards to book or
// open, and the sign-up band (members save on every booking).
// ─────────────────────────────────────────────────────────────────────────────

export default function MachinesPage({ category }: { category?: string }) {
    return (
        <>
            <PageHero
                eyebrow="Machines"
                title="Our machines."
                description="The top furniture machines at our Lagos factory, open to every maker. Pick the ones you need and book time. Members save on every booking."
            >
                <BookMachineTimeButton className={cn(WEBSITE_PRIMARY_BUTTON, "cursor-pointer")} />
                <Link href={`${SERVICES_URL}#machine-access`} className={WEBSITE_OUTLINE_BUTTON}>
                    How machine access works
                </Link>
            </PageHero>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-10">
                <Suspense fallback={<CategoryTabsSkeleton />}>
                    <CategoryTabs active={category} />
                </Suspense>
                {/* A new category shows the skeleton again rather than the last machines */}
                <Suspense key={category ?? "all"} fallback={<MachineGridSkeleton />}>
                    <Machines category={category} />
                </Suspense>
            </SectionWrapper>

            <CtaBand
                title="Save on every machine booking."
                description="Anyone can book the machines. Members on a plan with a machine discount pay less every time, and get paid furniture jobs too."
                secondaryLink={{ label: "See member savings", href: `${SERVICES_URL}#machine-access` }}
            />
        </>
    );
}

/** "All machines" and each category, as tabs along a line; scrolls sideways on phones. */
async function CategoryTabs({ active }: { active?: string }) {
    // Filtering is a nicety: without the categories the machines still show
    const categories = (await getWebsiteMachines())?.categories ?? [];
    if (categories.length < 2 && !active) return null;

    const options = [{ value: undefined as string | undefined, label: "All machines" }, ...categories.map((value) => ({ value, label: value }))];
    return (
        <nav aria-label="Machine categories" className="border-b border-border">
            <ul className="-mx-2.5 -mb-px flex gap-6 overflow-x-auto px-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {options.map((option) => {
                    const isActive = option.value === active;
                    return (
                        <li key={option.value ?? "all"} className="shrink-0">
                            <Link
                                href={getMachinesListUrl(option.value)}
                                aria-current={isActive ? "page" : undefined}
                                scroll={false}
                                className={cn(
                                    "block border-b-2 pt-1 pb-3 text-base whitespace-nowrap transition-colors",
                                    isActive
                                        ? "border-primary-950 font-medium text-primary-950"
                                        : "border-transparent font-light text-mist-700 hover:border-primary-300 hover:text-primary-900",
                                )}
                            >
                                {option.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

async function Machines({ category }: { category?: string }) {
    const catalogue = await getWebsiteMachines(category);

    if (!catalogue) {
        return (
            <p role="alert" className="text-base font-light text-mist-700">
                The machines couldn&apos;t be loaded right now. Please refresh the page in a minute.
            </p>
        );
    }

    if (catalogue.machines.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-mist-300 px-6 py-16 text-center">
                <p className="text-base font-light text-mist-600">
                    {category ? `There are no machines in ${category} right now.` : "Our machines will be listed here soon."}
                </p>
                {category && (
                    <Link href={MACHINES_URL} className="text-sm font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950">
                        See all machines
                    </Link>
                )}
            </div>
        );
    }

    return (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {catalogue.machines.map((machine) => (
                <li key={machine.id}>
                    <MachineCard machine={machine} unit={catalogue.unit} />
                </li>
            ))}
        </ul>
    );
}

function CategoryTabsSkeleton() {
    return (
        <div aria-hidden className="flex gap-6 overflow-hidden border-b border-border pb-3">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-24 shrink-0" />
            ))}
        </div>
    );
}
