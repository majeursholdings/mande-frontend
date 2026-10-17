import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Banknote,
    BriefcaseBusiness,
    CalendarCheck,
    Check,
    Factory,
    Hammer,
    MessageSquareText,
    UserRoundCheck,
    UsersRound,
    WalletMinimal,
    type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ACCELERATOR_LOAN_LABEL, ACCELERATOR_PROGRAM_NAME } from "@/constant/accelerator";
import { JOB_BONUS_PERCENT, JOB_PAYMENT_SCHEDULE } from "@/constant/jobWorkflow";
import { MANUFACTURER_MACHINE_BOOKINGS_URL } from "@/constant/manufacturer";
import {
    ACCELERATOR_SECTION_ID,
    ACCELERATOR_URL,
    ARTISAN_LOGIN_URL,
    COMMUNITY_URL,
    CONTACT_URL,
    FAQ_URL,
    MACHINE_BOOKING_MY_BOOKINGS_URL,
    MACHINES_URL,
    OPEN_JOBS_URL,
} from "@/constant/navigation";
import { SUPPORT_HOURS } from "@/constant/support";
import { getMachineAccess, getWebsiteMachines, getWebsitePlans } from "@/lib/services/websiteService";
import AcceleratorPanel from "../common/acceleratorPanel";
import CtaBand from "../common/ctaBand";
import HoverCard, { HoverCardIcon } from "../common/hoverCard";
import { FACTORY_WORK } from "../common/factoryWork";
import PageHero from "../common/pageHero";
import Reveal from "../common/reveal";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_ON_DARK_BUTTON, WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import MachineCard, { MachineGridSkeleton } from "../machinesPage/machineCard";
import BookMachineTimeButton from "./bookMachineTimeButton";
import CommunityPhotoOverlay from "./communityPhotoOverlay";
import JobsPhotoOverlay from "./jobsPhotoOverlay";
import WalletPhotoOverlay from "./walletPhotoOverlay";

const MACHINE_ACCESS_ID = "machine-access";
/** Machines previewed in the machine access section; the rest are on /machines. */
const PREVIEW_MACHINES = 3;

/** Logging in from the website lands on the app's booking page, where the plan discount applies. */
const MACHINE_DISCOUNT_LOGIN_URL = `${ARTISAN_LOGIN_URL}?next=${encodeURIComponent(MANUFACTURER_MACHINE_BOOKINGS_URL)}`;

type Service = {
    icon: LucideIcon;
    title: string;
    description: string;
    link: { label: string; href: string };
    /** A photo for the card, from /public (e.g. "/images/services/wallet.jpg"). Until one is set, the icon shows on a tinted panel. */
    image?: { src: string; alt: string };
    /** Illustration laid over the photo, e.g. the app's own UI. */
    overlay?: ReactNode;
};

const SERVICES: Service[] = [
    {
        icon: Factory,
        title: "Furniture machines, open to all",
        description: "Book time on the country's top furniture machines at our Lagos factory. Anyone can book. Members pay less.",
        link: { label: "See our furniture machines", href: MACHINES_URL },
        image: { src: "/images/webpage/machines.webp", alt: "A furniture maker working on a machine" },
    },
    {
        icon: BriefcaseBusiness,
        title: "Paid furniture jobs",
        description: `Real projects with drawings, a budget and a deadline. You're paid in ${JOB_PAYMENT_SCHEDULE.length} parts as each stage is approved, plus a ${JOB_BONUS_PERCENT}% bonus for finishing on time.`,
        link: { label: "Browse open jobs", href: OPEN_JOBS_URL },
        image: {
            src: "/images/webpage/Furniture_maker_pointing_at_drawing_20261015195528.webp",
            alt: "A furniture maker pointing at a job's drawings on a workbench, beside a sideboard being built",
        },
        overlay: <JobsPhotoOverlay />,
    },
    {
        icon: Banknote,
        title: `Loans of up to ${ACCELERATOR_LOAN_LABEL}`,
        description: `Borrow through the ${ACCELERATOR_PROGRAM_NAME} to invest in your workshop and take on bigger work.`,
        link: { label: "About the accelerator", href: ACCELERATOR_URL },
        image: { src: "/images/webpage/Workshop_owner_beside_woodworkin…_20261015200449.webp", alt: "A man in his furniture workshop with his new purchased machines for his furniture business growth" },
    },
    {
        icon: WalletMinimal,
        title: "Your MANDE wallet",
        description: "Payments land in your wallet as soon as they're earned. Withdraw to your bank account any time.",
        link: { label: "How payments work", href: `${FAQ_URL}#payments` },
        image: {
            src: "/images/webpage/mande_wallet_payment.webp",
            alt: "A furniture maker in a workshop checking their phone as a job payment lands in their MANDE wallet",
        },
        overlay: <WalletPhotoOverlay />,
    },
    {
        icon: UserRoundCheck,
        title: "A dedicated officer",
        description: "One person at MANDE who knows your workshop and your jobs. Included on the Workshop and Studio plans.",
        link: { label: "Talk to us", href: CONTACT_URL },
        image: { src: "/images/webpage/Men_discussing_wooden_joinery_wo…_20261015203650.webp", alt: "A furniture maker in his workshop with his dedicated officer" },
    },
    {
        icon: UsersRound,
        title: "Community and support",
        description: `Job alerts and tips from other makers on WhatsApp, and a support team on hand ${SUPPORT_HOURS}.`,
        link: { label: "Join the community", href: COMMUNITY_URL },
        image: {
            src: "/images/webpage/mande_furniture_makers_community.webp",
            alt: "Furniture makers in a workshop gathered round a phone, smiling",
        },
        overlay: <CommunityPhotoOverlay />,
    },
];

const BOOKING_STEPS: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: MessageSquareText,
        title: "Tell us what you're making",
        description: "Book online: choose your machines and say what you're making, or ask your dedicated officer if you have one.",
    },
    {
        icon: CalendarCheck,
        title: "Pick a time",
        description: "Choose a date and start time and pay. We confirm your slot at the factory by email.",
    },
    {
        icon: Hammer,
        title: "Come in and build",
        description: "Bring your drawings and materials. Our factory team gets you set up.",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Services: what MANDE gives furniture makers. The overview cards, then the
// Lagos factory (open to everyone, cheaper for members: a preview of the
// machines, what you can do there, what each plan saves, how to book), the
// Accelerator Program loans,
// and the sign-up band.
// ─────────────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
    return (
        <>
            <PageHero
                eyebrow="Services"
                title="Jobs, machines and funding for furniture makers."
                description="Paid furniture work, time on top furniture machines at our Lagos factory, and loans to grow your workshop. Here's what MANDE gives you."
            >
                <Link href={`#${MACHINE_ACCESS_ID}`} className={WEBSITE_PRIMARY_BUTTON}>
                    Book machine time
                </Link>
                <Link href={OPEN_JOBS_URL} className={WEBSITE_OUTLINE_BUTTON}>
                    Browse open jobs
                </Link>
            </PageHero>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <span className="text-lg font-medium">What&apos;s included</span>
                    <SectionHeading as="h2">What MANDE gives you.</SectionHeading>
                </div>
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {SERVICES.map((service, index) => (
                        <Reveal as="li" key={service.title} index={index}>
                            <HoverCard className="h-full rounded-[10px]">
                                <ServiceCard service={service} />
                            </HoverCard>
                        </Reveal>
                    ))}
                </ul>
            </SectionWrapper>

            <SectionWrapper
                id={MACHINE_ACCESS_ID}
                className="scroll-mt-16 bg-mist-200"
                containerClassName="flex flex-col gap-12 md:gap-16"
            >
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
                    <div className="flex flex-1 flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <span className="flex items-center gap-2 text-lg font-medium">
                                <Factory className="size-5 text-primary-800" strokeWidth={1.75} aria-hidden />
                                Machine access
                            </span>
                            <SectionHeading as="h2">Top furniture machines, open to every maker.</SectionHeading>
                            <p className="text-base font-light">
                                Big jobs need big machines. You don&apos;t have to buy them. Book time at our factory in Lagos,
                                whether you&apos;re on MANDE or not. Members pay less.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <BookMachineTimeButton className={cn(WEBSITE_PRIMARY_BUTTON, "cursor-pointer")} />
                            <Link
                                href={MACHINE_BOOKING_MY_BOOKINGS_URL}
                                className="text-sm font-medium text-mist-700 underline-offset-4 hover:text-mist-950 hover:underline"
                            >
                                Already booked? See your bookings
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1">
                        <Image
                            src="/images/carpenter_working.png"
                            alt="A furniture maker at work at the MANDE factory"
                            width={1000}
                            height={667}
                            className="aspect-1000/667 w-full rounded-[10px] object-cover object-center"
                        />
                    </div>
                </div>

                <MachinesPreview />

                <FactoryLine />
            </SectionWrapper>

            <MemberSavings />

            <SectionWrapper className="bg-mist-200">
                <BookingTimeline />
            </SectionWrapper>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <span className="text-lg font-medium">Funding</span>
                    <SectionHeading as="h2">Money to grow, not just work to do.</SectionHeading>
                </div>
                <AcceleratorPanel id={ACCELERATOR_SECTION_ID} />
            </SectionWrapper>

            <CtaBand
                title="Ready to grow your workshop?"
                description="Create your profile to get paid jobs, save on machine time and ask about the accelerator."
                secondaryLink={{ label: "Contact us", href: CONTACT_URL }}
            />
        </>
    );
}

/**
 * A service as a card: its photo on top (or its icon on a tinted panel until
 * one is added), then what it is and the way to it. The whole card is the
 * link; the photo zooms in a little on hover, and the HoverCard around it
 * lifts it.
 */
function ServiceCard({ service }: { service: Service }) {
    const { icon: Icon, title, description, link, image, overlay } = service;
    return (
        <Link
            href={link.href}
            className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-border bg-white transition-colors duration-300 hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
        >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-primary-50">
                {image ? (
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div
                        aria-hidden
                        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-primary-50 to-primary-100"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(var(--color-primary-200)_1px,transparent_1px)] bg-size-[18px_18px]" />
                        <Icon
                            className="absolute -right-6 -bottom-8 size-44 text-primary-200 transition-transform duration-500 group-hover:scale-105"
                            strokeWidth={1}
                        />
                        <HoverCardIcon className="relative flex size-20 items-center justify-center rounded-full bg-white text-primary-800 shadow-sm">
                            <Icon className="size-9" strokeWidth={1.5} />
                        </HoverCardIcon>
                    </div>
                )}
                {image && overlay}
                {/* The icon stays on every card, as a small badge over the photo's corner */}
                {image && (
                    <HoverCardIcon className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-primary-900 shadow-xs backdrop-blur-sm">
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </HoverCardIcon>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6 lg:p-7">
                <h3 className="text-xl font-medium">{title}</h3>
                <p className="flex-1 text-base font-light text-mist-700">{description}</p>
                <span className="inline-flex w-fit items-center gap-1.5 pt-1 text-sm font-medium text-primary-800 group-hover:text-primary-950">
                    {link.label}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </span>
            </div>
        </Link>
    );
}

/** A few machines from the catalogue as cards, with the way to see them all. */
function MachinesPreview() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="flex flex-col gap-2">
                    <h3 className="text-2xl tracking-tight md:text-3xl">Our furniture machines</h3>
                    <p className="max-w-120 text-base font-light text-mist-700">
                        See what each machine does and what it costs, then book the ones you need.
                    </p>
                </div>
                <Link
                    href={MACHINES_URL}
                    className="group inline-flex w-fit shrink-0 items-center gap-1.5 text-base font-medium text-primary-800 hover:text-primary-950"
                >
                    See all furniture machines
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
            </div>
            <Suspense fallback={<MachineGridSkeleton count={PREVIEW_MACHINES} />}>
                <PreviewMachines />
            </Suspense>
        </div>
    );
}

async function PreviewMachines() {
    const catalogue = await getWebsiteMachines();
    if (!catalogue) {
        return (
            <p role="alert" className="text-base font-light text-mist-700">
                The machines couldn&apos;t be loaded right now. Please refresh the page in a minute.
            </p>
        );
    }
    if (catalogue.machines.length === 0) {
        return (
            <p className="rounded-[10px] border border-dashed border-mist-300 px-6 py-10 text-center text-base font-light text-mist-600">
                Our machines will be listed here soon.
            </p>
        );
    }
    return (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {catalogue.machines.slice(0, PREVIEW_MACHINES).map((machine) => (
                <li key={machine.id}>
                    <MachineCard machine={machine} unit={catalogue.unit} />
                </li>
            ))}
        </ul>
    );
}

/** What you can do at the factory, as a line of stations a piece moves along: cut, then join, then finish. */
function FactoryLine() {
    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-12">
                <h3 className="text-2xl tracking-tight md:text-3xl">What you can do there</h3>
                <p className="max-w-120 text-base font-light text-mist-700">
                    Choose the machines you need and take a piece from raw panels to a finished surface, all under one roof.
                </p>
            </div>
            <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
                {/* The line joining the stations: across on wide screens, down on phones */}
                <div
                    aria-hidden
                    className="absolute top-10 right-[16.67%] left-[16.67%] hidden border-t-2 border-dashed border-primary-300 md:block"
                />
                <div aria-hidden className="absolute top-10 bottom-10 left-10 border-l-2 border-dashed border-primary-300 md:hidden" />
                {FACTORY_WORK.map(({ icon: Icon, title, description }, index) => (
                    <li key={title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
                        <span className="relative z-10 flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-mist-200 bg-primary-950 text-primary-300 shadow-sm">
                            <Icon className="size-8" strokeWidth={1.5} aria-hidden />
                            <span className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary-500 font-mono text-xs font-semibold text-primary-950">
                                {index + 1}
                            </span>
                        </span>
                        <div className="flex flex-col gap-1 pt-3 md:max-w-64 md:pt-0">
                            <p className="text-xl font-medium">{title}</p>
                            <p className="text-base font-light text-mist-700">{description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/**
 * What members save on machine time, as its own deep green band: the copy
 * and the way to book on one side, a photo on the other. The plans' discounts
 * load from their own "Easy access to top machinery" row.
 */
function MemberSavings() {
    return (
        <SectionWrapper className="bg-primary-950 text-mist-100" containerClassName="flex flex-col gap-10 md:flex-row md:items-center md:gap-16">
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <span className="text-lg font-medium text-primary-300">Member savings</span>
                    <SectionHeading as="h2" className="text-white">
                        What members save
                    </SectionHeading>
                    <p className="max-w-130 text-base font-light text-mist-200">
                        Anyone can book the furniture machines at the standard rate. Members on a plan with a machine
                        discount get money off every booking. Log in before you book and it comes off the price
                        automatically.
                    </p>
                </div>
                <Suspense fallback={<PlanDiscountsSkeleton />}>
                    <PlanDiscounts />
                </Suspense>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <BookMachineTimeButton className={cn(WEBSITE_ON_DARK_BUTTON, "cursor-pointer")} />
                    <Link
                        href={MACHINE_DISCOUNT_LOGIN_URL}
                        className="group inline-flex items-center gap-1.5 text-base font-medium text-primary-300 hover:text-primary-200"
                    >
                        Log in to use your discount
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                    </Link>
                </div>
            </div>
            <div className="flex-1">
                <Image
                    src="/images/image1.png"
                    alt="A finished leather sofa being photographed outside a workshop"
                    width={900}
                    height={900}
                    className="aspect-4/3 w-full rounded-[10px] object-cover object-center"
                />
            </div>
        </SectionWrapper>
    );
}

/** The percentage in a discount like "20% off", or null when it doesn't say one. */
const percentOff = (discount: string | null) => {
    const match = discount?.match(/(\d+(?:\.\d+)?)\s*%/);
    return match ? Math.min(100, Number(match[1])) : null;
};

/** Each plan's machine discount as a plain line: the plan, then what it takes off. */
async function PlanDiscounts() {
    const plans = (await getWebsitePlans())?.plans ?? [];
    if (plans.length === 0) {
        return (
            <p role="alert" className="text-base font-light text-mist-300">
                The plans couldn&apos;t be loaded right now. Please refresh the page in a minute.
            </p>
        );
    }
    const rows = [
        { id: "no-plan", name: "Without a plan", discount: null as string | null },
        ...plans.map((plan) => ({ id: plan.id, name: `${plan.name} plan`, discount: getMachineAccess(plan) })),
    ];

    return (
        <dl className="flex max-w-130 flex-col border-t border-white/10">
            {rows.map((row) => {
                const off = percentOff(row.discount);
                return (
                    <div key={row.id} className="flex items-baseline justify-between gap-6 border-b border-white/10 py-3">
                        <dt className="text-base text-mist-100">{row.name}</dt>
                        <dd className={row.discount ? "text-base font-medium text-primary-300" : "text-base font-light text-mist-300"}>
                            {off !== null ? `${off}% off every booking` : (row.discount ?? "Standard rate")}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}

function PlanDiscountsSkeleton() {
    return (
        <div aria-hidden className="flex max-w-130 flex-col border-t border-white/10">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-6 border-b border-white/10 py-3.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-40" />
                </div>
            ))}
        </div>
    );
}

// What to have ready when booking, beside the steps
const BRING_LIST = ["Your drawings", "Your materials", "The machines you need", "Your deadline"];

/** How to book: the three steps as a timeline, beside what to have ready and the way to book. */
function BookingTimeline() {
    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="flex flex-col gap-8 lg:col-span-3">
                <h3 className="text-2xl tracking-tight md:text-3xl">How to book</h3>
                <ol className="flex flex-col">
                    {BOOKING_STEPS.map(({ icon: Icon, title, description }, index) => (
                        <li key={title} className="relative flex gap-5 pb-10 last:pb-0">
                            {/* The line down to the next step */}
                            {index < BOOKING_STEPS.length - 1 && (
                                <span aria-hidden className="absolute top-12 bottom-0 left-6 w-0.5 -translate-x-1/2 bg-primary-300" />
                            )}
                            <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-primary-900 ring-1 ring-primary-300">
                                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                            </span>
                            <div className="flex flex-col gap-1 pt-1">
                                <span className="font-mono text-xs font-semibold tracking-wider text-primary-700">
                                    STEP {String(index + 1).padStart(2, "0")}
                                </span>
                                <p className="text-xl font-medium">{title}</p>
                                <p className="max-w-110 text-base font-light text-mist-700">{description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="flex flex-col justify-between gap-8 self-start rounded-[10px] bg-primary-950 p-6 text-mist-100 md:p-8 lg:col-span-2">
                <div className="flex flex-col gap-5">
                    <p className="text-xl font-medium text-white">Have these ready</p>
                    <ul className="flex flex-col gap-3">
                        {BRING_LIST.map((item) => (
                            <li key={item} className="flex items-center gap-3 text-base font-light">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-primary-300">
                                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
                    <BookMachineTimeButton className={cn(WEBSITE_ON_DARK_BUTTON, "w-full cursor-pointer py-2.5")} />
                    <p className="text-sm font-light text-mist-400">On the Workshop or Studio plan? Your dedicated officer can book it for you.</p>
                </div>
            </div>
        </div>
    );
}
