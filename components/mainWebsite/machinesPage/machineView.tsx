import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MACHINES_URL, MACHINE_BOOKING_MY_BOOKINGS_URL, SERVICES_URL, getMachinesListUrl } from "@/constant/navigation";
import { getWebsiteMachines, type WebsiteMachineDetail } from "@/lib/services/websiteService";
import CtaBand from "../common/ctaBand";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import BookMachineTimeButton from "../servicesPage/bookMachineTimeButton";
import MachineCard, { MachineGridSkeleton } from "./machineCard";
import { MachinePhoto, MachinePrices, getNotBookableNote } from "./machineParts";

/** Other machines shown under one, from its category. */
const RELATED_COUNT = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Machine: one machine in the catalogue: its photo, what it is and does, its
// prices, and the way to book it (the booking form opens with it picked).
// Then other machines in the same category, and the sign-up band.
// ─────────────────────────────────────────────────────────────────────────────

export default function MachineView({ detail }: { detail: WebsiteMachineDetail }) {
    const { machine, unit } = detail;
    const facts = [
        { label: "Model", value: machine.model },
        { label: "Type", value: machine.type },
        { label: "Category", value: machine.category },
    ].filter((fact): fact is { label: string; value: string } => !!fact.value);

    return (
        <>
            <SectionWrapper containerClassName="flex flex-col gap-8">
                <Link href={MACHINES_URL} className="inline-flex w-fit items-center gap-2 text-sm text-mist-700 hover:text-primary-800">
                    <ArrowLeft className="size-4" aria-hidden />
                    Back to all machines
                </Link>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
                    <MachinePhoto
                        machine={machine}
                        sizes="(min-width: 1024px) 55vw, 100vw"
                        priority
                        className="aspect-4/3 w-full rounded-[10px] lg:self-start"
                    />

                    <div className="flex min-w-0 flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <Link
                                href={getMachinesListUrl(machine.category)}
                                className="w-fit text-sm font-medium text-primary-800 hover:underline wrap-anywhere"
                            >
                                {machine.category}
                            </Link>
                            <h1 className="text-3xl tracking-tight text-pretty wrap-anywhere md:text-5xl">{machine.name}</h1>
                            {machine.description && (
                                <p className="text-base font-light whitespace-pre-line text-mist-800">{machine.description}</p>
                            )}
                        </div>

                        <dl className="flex flex-col divide-y divide-border border-y border-border">
                            {facts.map((fact) => (
                                <div key={fact.label} className="flex items-baseline justify-between gap-6 py-3">
                                    <dt className="text-sm font-light text-mist-600">{fact.label}</dt>
                                    <dd className="text-right text-base text-mist-950 wrap-anywhere">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="flex flex-col gap-2">
                            <h2 className="text-sm font-medium text-mist-700">Price</h2>
                            <MachinePrices machine={machine} unit={unit} size="lg" />
                            <p className="text-sm font-light text-mist-600">
                                Bookings are by the {unit} right now. Members on a plan with a machine discount pay less.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <BookMachineTimeButton
                                initialMachineIds={[machine.id]}
                                disabled={!machine.bookable}
                                className={cn(
                                    WEBSITE_PRIMARY_BUTTON,
                                    "w-full cursor-pointer py-2.5 sm:w-fit disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-primary-950 disabled:hover:bg-primary-950 disabled:hover:text-mist-100",
                                )}
                            >
                                Book this machine
                            </BookMachineTimeButton>
                            {!machine.bookable ? (
                                <p className="text-sm font-light text-mist-700">{getNotBookableNote(unit)}</p>
                            ) : (
                                <Link
                                    href={MACHINE_BOOKING_MY_BOOKINGS_URL}
                                    className="w-fit text-sm font-medium text-mist-700 underline-offset-4 hover:text-mist-950 hover:underline"
                                >
                                    Already booked? See your bookings
                                </Link>
                            )}
                        </div>

                        {machine.functions.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h2 className="text-xl font-medium">What it does</h2>
                                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    {machine.functions.map((fn) => (
                                        <li key={fn} className="flex items-start gap-3 text-base font-light">
                                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                                <Check className="size-3" strokeWidth={2.5} aria-hidden />
                                            </span>
                                            <span className="min-w-0 wrap-anywhere">{fn}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </SectionWrapper>

            <Suspense fallback={<RelatedSkeleton category={machine.category} />}>
                <RelatedMachines machineId={machine.id} category={machine.category} />
            </Suspense>

            <CtaBand
                title="Save on every machine booking."
                description="Anyone can book the machines. Members on a plan with a machine discount pay less every time, and get paid furniture jobs too."
                secondaryLink={{ label: "See member savings", href: `${SERVICES_URL}#machine-access` }}
            />
        </>
    );
}

function RelatedHeading({ category }: { category: string }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <SectionHeading as="h2" className="normal-case">
                More {category} machines
            </SectionHeading>
            <Link
                href={getMachinesListUrl(category)}
                className="group inline-flex w-fit shrink-0 items-center gap-1.5 text-sm font-medium text-primary-800 hover:text-primary-950"
            >
                See all in {category}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
        </div>
    );
}

/** Other machines in the same category; left out when there are none (or they can't be loaded). */
async function RelatedMachines({ machineId, category }: { machineId: string; category: string }) {
    const catalogue = await getWebsiteMachines(category);
    const others = (catalogue?.machines ?? []).filter((machine) => machine.id !== machineId).slice(0, RELATED_COUNT);
    if (!catalogue || others.length === 0) return null;

    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-10">
            <RelatedHeading category={category} />
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {others.map((machine) => (
                    <li key={machine.id}>
                        <MachineCard machine={machine} unit={catalogue.unit} />
                    </li>
                ))}
            </ul>
        </SectionWrapper>
    );
}

function RelatedSkeleton({ category }: { category: string }) {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-10">
            <RelatedHeading category={category} />
            <MachineGridSkeleton count={RELATED_COUNT} />
        </SectionWrapper>
    );
}
