import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Factory } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MACHINES_URL, SERVICES_URL } from "@/constant/navigation";
import { getMachineAccess, getWebsiteMachines, getWebsitePlans } from "@/lib/services/websiteService";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import AcceleratorPanel from "../common/acceleratorPanel";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import MachineCard, { MachineGridSkeleton } from "../machinesPage/machineCard";
import BookMachineTimeButton from "../servicesPage/bookMachineTimeButton";

/** Machines previewed on the homepage; the rest are on /machines. */
const PREVIEW_MACHINES = 3;

/**
 * How MANDE helps a workshop grow past its own walls: machine time at the
 * Lagos factory (a factory photo with each plan's member discount over it, and
 * a preview of the machines), and loans through the MANDE Accelerator Program.
 */
export default function FactorySection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-12 md:gap-16">
            <div className="flex flex-col gap-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-16">
                    <div className="flex flex-col gap-4">
                        <span className="flex items-center gap-2 text-lg font-medium">
                            <Factory className="size-5 text-primary-800" strokeWidth={1.75} aria-hidden />
                            Machine access
                        </span>
                        <SectionHeading as="h2">Build bigger at our Lagos factory.</SectionHeading>
                        <p className="max-w-150 text-base font-light">
                            Not every workshop can own the machines that big jobs need. Our factory in Lagos has the
                            country&apos;s top furniture machines, and they&apos;re open to every maker: book time, take on
                            bigger and more precise work, and skip buying the equipment. Members save on every booking.
                        </p>
                    </div>

                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-[10px] bg-mist-100">
                        <Image
                            src="/images/webpage/Furniture_maker_operates_CNC_router.webp"
                            alt="A furniture maker at work on a machine at the MANDE factory"
                            fill
                            sizes="(min-width: 1024px) 40vw, 100vw"
                            className="object-cover object-center"
                        />
                        <div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-4">
                            <Suspense fallback={<MachineDiscountsSkeleton />}>
                                <MachineDiscounts />
                            </Suspense>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1.5">
                        <h3 className="text-2xl tracking-tight md:text-3xl">Our furniture machines</h3>
                        <p className="max-w-120 text-base font-light text-mist-700">
                            See what each machine does and what it costs, then book the ones you need.
                        </p>
                    </div>
                    <Suspense fallback={<MachineGridSkeleton count={PREVIEW_MACHINES} />}>
                        <PreviewMachines />
                    </Suspense>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <BookMachineTimeButton className={cn(WEBSITE_PRIMARY_BUTTON, "cursor-pointer")} />
                    <Link href={MACHINES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                        See all furniture machines
                    </Link>
                </div>
            </div>

            <AcceleratorPanel />
        </SectionWrapper>
    );
}

/**
 * Up to three machines from the catalogue. With none listed (or the API down)
 * the grid steps aside for a short line and the way to how machine access works.
 */
async function PreviewMachines() {
    const catalogue = await getWebsiteMachines();
    const machines = catalogue?.machines.slice(0, PREVIEW_MACHINES) ?? [];

    if (!catalogue || machines.length === 0) {
        return (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-light text-mist-700">
                {catalogue
                    ? "Our machines will be listed here soon."
                    : "The machines couldn't be loaded right now."}
                <Link
                    href={`${SERVICES_URL}#machine-access`}
                    className="group inline-flex items-center gap-1.5 font-medium text-primary-800 hover:text-primary-950"
                >
                    How machine access works
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
            </p>
        );
    }

    return (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {machines.map((machine) => (
                <li key={machine.id}>
                    <MachineCard machine={machine} unit={catalogue.unit} />
                </li>
            ))}
        </ul>
    );
}

/** The plans with machine access and their member discount, from the plans' "Easy access to top machinery" row. */
async function MachineDiscounts() {
    const plans = (await getWebsitePlans())?.plans ?? [];
    const discounts = plans.flatMap((plan) => {
        const value = getMachineAccess(plan);
        return value ? [{ id: plan.id, name: plan.name, value }] : [];
    });
    if (discounts.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 rounded-[10px] bg-white/95 p-5 shadow-sm backdrop-blur-sm md:p-6">
            <p className="text-sm font-medium text-mist-700">Member discount on machine time</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2">
                {discounts.map((plan) => (
                    <div key={plan.id} className="flex min-w-0 flex-col gap-0.5">
                        <dt className="text-sm font-light text-mist-700">{plan.name} plan</dt>
                        <dd className="text-xl font-medium text-primary-900 wrap-anywhere">{plan.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function MachineDiscountsSkeleton() {
    return (
        <div className="flex flex-col gap-3 rounded-[10px] bg-white/95 p-5 shadow-sm backdrop-blur-sm md:p-6">
            <p className="text-sm font-medium text-mist-700">Member discount on machine time</p>
            <div aria-hidden className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2">
                {[1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
