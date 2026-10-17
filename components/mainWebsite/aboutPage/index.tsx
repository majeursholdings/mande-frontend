import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    Banknote,
    BriefcaseBusiness,
    Camera,
    Check,
    ClipboardCheck,
    DoorOpen,
    Factory,
    Hammer,
    ShoppingBag,
    UserRoundCheck,
    UsersRound,
    WalletMinimal,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clientList } from "@/constant/global";
import { ACCELERATOR_LOAN_LABEL, ACCELERATOR_PROGRAM_NAME } from "@/constant/accelerator";
import {
    FAULT_REPORT_DAYS,
    JOB_BONUS_PERCENT,
    JOB_PAYMENT_SCHEDULE,
    MAX_STEP_PROOF_PHOTOS,
    REVIEW_WINDOW_HOURS,
} from "@/constant/jobWorkflow";
import {
    ACCELERATOR_URL,
    ARTISAN_SIGNUP_URL,
    COMMUNITY_URL,
    FAQ_URL,
    MACHINES_URL,
    OPEN_JOBS_URL,
    SERVICES_URL,
    SHOP_NAME,
    SHOP_URL,
} from "@/constant/navigation";
import { SUPPORT_HOURS } from "@/constant/support";
import CtaBand from "../common/ctaBand";
import HoverCard, { HoverCardIcon } from "../common/hoverCard";
import { FACTORY_WORK } from "../common/factoryWork";
import PageHero from "../common/pageHero";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import VideoPlayer from "../common/videoPlayer";
import {
    WEBSITE_ON_DARK_BUTTON,
    WEBSITE_ON_DARK_OUTLINE_BUTTON,
    WEBSITE_OUTLINE_BUTTON,
    WEBSITE_PRIMARY_BUTTON,
} from "../common/buttonStyles";

const FIRST_PAYMENT = JOB_PAYMENT_SCHEDULE[0];

// What held makers back, and what MANDE does about each, beside the story
const PROBLEMS: { problem: string; answer: string }[] = [
    { problem: "Finding steady work", answer: "Real jobs with drawings, a budget and a deadline" },
    { problem: "Chasing payment", answer: "Paid in stages as each part of the work is approved" },
    { problem: "Machines and money", answer: `Time on top furniture machines and loans of up to ${ACCELERATOR_LOAN_LABEL}` },
];

// How MANDE works, on the dark band under the mission
const PRINCIPLES: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: WalletMinimal,
        title: "Paid as you work",
        description: `${FIRST_PAYMENT.percent}% the day you accept a job, then a share at every approved stage. No waiting until the very end.`,
    },
    {
        icon: Camera,
        title: "Proof at every stage",
        description: `Up to ${MAX_STEP_PROOF_PHOTOS} photos per stage, checked against the drawing, and approved automatically if no one reviews them within ${REVIEW_WINDOW_HOURS} hours.`,
    },
    {
        icon: ClipboardCheck,
        title: "A project lead on every job",
        description: "Someone from MANDE agrees the drawings with you, checks each stage and signs off the work.",
    },
    {
        icon: DoorOpen,
        title: "Open to every maker",
        description: "Our furniture machines can be booked by anyone. Members simply pay less.",
    },
];

const FOR_MAKERS = [
    "Paid furniture jobs from brands and businesses",
    `Payment in ${JOB_PAYMENT_SCHEDULE.length} parts, plus a ${JOB_BONUS_PERCENT}% on-time bonus`,
    "Discounted time on our furniture machines",
    `Access to loans through the ${ACCELERATOR_PROGRAM_NAME}`,
];

const FOR_BUYERS = [
    "Everyday basics: stools, armchairs, beds and more",
    "Some of the most affordable prices on the market",
    "Simple, sturdy pieces made for daily use",
];

// ─────────────────────────────────────────────────────────────────────────────
// About MANDE: the story (what held makers back and how MANDE answers it), the
// mission and the principles behind it, everything MANDE offers (jobs, the
// Accelerator Program loans, factory machines, community, the wallet and a
// dedicated officer), exactly how a job's pay is split (from the platform's
// own payment schedule), who MANDE is for (makers, and buyers on the MANDE Furniture shop),
// the brands makers build for and their stories, and the sign-up band.
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
    return (
        <>
            <PageHero
                eyebrow="About MANDE"
                title="Built for the people who build furniture."
                description="MANDE gives furniture makers and woodworkers everything they need to grow: real paid jobs, time on top furniture machines at our Lagos factory, funding for their workshop and a community of makers behind them."
            >
                <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_PRIMARY_BUTTON}>
                    Create your profile
                </Link>
                <Link href={SERVICES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                    See our services
                </Link>
            </PageHero>

            <StorySection />
            <MissionSection />
            <OfferSection />
            <PaymentSection />
            <AudienceSection />
            <MakersSection />

            <CtaBand />
        </>
    );
}

/** Why MANDE exists: the story beside an animation of the gaps MANDE fills, then what held makers back and what MANDE does about it. */
function StorySection() {
    return (
        <SectionWrapper containerClassName="flex flex-col gap-12 md:gap-16">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
                <div className="flex flex-1 flex-col gap-4">
                    <span className="text-lg font-medium">Our story</span>
                    <SectionHeading as="h2" className="max-w-175">
                        Skill was never the problem.
                    </SectionHeading>
                    <p className="text-base font-light">
                        Nigeria&apos;s furniture makers can build almost anything. What holds a workshop back is everything
                        around the work: finding the next job, getting paid on time, and affording the machines and
                        materials that bigger projects need.
                    </p>
                    <p className="text-base font-light">
                        We built MANDE to take those weights off the maker. We bring the work and a project lead to guide
                        it, pay for each stage as it&apos;s approved, open our factory to anyone who needs its machines, and
                        lend to makers ready to grow. You build the furniture. We handle the rest.
                    </p>
                </div>
                <div className="flex-1">
                    <VideoPlayer
                        src="https://res.cloudinary.com/zihare24/video/upload/v1792240320/mande-film-web-3x2.mp4"
                        poster="/videos/mande-filling-the-gaps-poster.webp"
                        className="aspect-3/2 w-full"
                    />
                </div>
            </div>

            <dl className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
                {PROBLEMS.map(({ problem, answer }) => (
                    <div key={problem} className="flex flex-col gap-3 border-t border-mist-300 pt-6">
                        <dt className="text-sm font-light text-mist-600">
                            <span className="sr-only">The problem: </span>
                            {problem}
                        </dt>
                        <dd className="flex items-start gap-2.5 text-lg font-medium">
                            <ArrowRight className="mt-1 size-4.5 shrink-0 text-primary-700" aria-hidden />
                            <span>
                                <span className="sr-only">What MANDE does: </span>
                                {answer}
                            </span>
                        </dd>
                    </div>
                ))}
            </dl>
        </SectionWrapper>
    );
}

/** The mission in large type on dark green, with the principles MANDE works by under it. */
function MissionSection() {
    return (
        <SectionWrapper className="relative overflow-hidden bg-primary-950 text-mist-100" containerClassName="relative flex flex-col gap-12 md:gap-16">
            {/* A soft glow behind the mission, for depth */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-40 -left-40 size-120 rounded-full bg-primary-500/10 blur-3xl"
            />
            <div className="relative flex max-w-200 flex-col gap-5">
                <span className="text-lg font-medium text-primary-300">Our mission</span>
                <p className="text-3xl leading-tight tracking-tight text-white text-pretty md:text-4xl lg:text-5xl">
                    To help every furniture maker build more, get paid on time and grow a workshop that lasts.
                </p>
            </div>
            <ul className="relative grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {PRINCIPLES.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex flex-col gap-3 border-t border-white/15 pt-6">
                        <span className="flex size-11 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
                            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                        </span>
                        <h3 className="text-xl font-medium text-white">{title}</h3>
                        <p className="text-base font-light text-mist-300">{description}</p>
                    </li>
                ))}
            </ul>
        </SectionWrapper>
    );
}

const CARD_CLASS = "flex flex-col gap-4 rounded-[10px] bg-white p-6 lg:p-8";
const CARD_LINK_CLASS =
    "group mt-auto inline-flex w-fit items-center gap-1.5 pt-2 text-sm font-medium text-primary-800 hover:text-primary-950";

function CardLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
    return (
        <Link href={href} className={cn(CARD_LINK_CLASS, className)}>
            {children}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
    );
}

function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
    return (
        <HoverCardIcon className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </HoverCardIcon>
    );
}

/** Everything MANDE offers, as a grid of cards, each with the way to its page. */
function OfferSection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <span className="text-lg font-medium">What we offer</span>
                    <SectionHeading as="h2">Everything a workshop needs, in one place.</SectionHeading>
                </div>
                <Link
                    href={SERVICES_URL}
                    className="group inline-flex w-fit shrink-0 items-center gap-1.5 text-base font-medium text-primary-800 hover:text-primary-950"
                >
                    See all services
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
            </div>

            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                <HoverCard as="li" className={cn(CARD_CLASS, "md:col-span-2")}>
                    <CardIcon icon={BriefcaseBusiness} />
                    <h3 className="text-2xl font-medium tracking-tight">Paid furniture jobs</h3>
                    <p className="max-w-150 text-base font-light text-mist-700">
                        Real projects from the brands and businesses that build with MANDE. Apply for open jobs, or be
                        offered work that fits your specialities.
                    </p>
                    <ul className="flex flex-wrap gap-2">
                        {[
                            "Drawings, budget and deadline",
                            `Paid in ${JOB_PAYMENT_SCHEDULE.length} parts`,
                            `${JOB_BONUS_PERCENT}% on-time bonus`,
                        ].map((fact) => (
                            <li
                                key={fact}
                                className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-900"
                            >
                                <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                                {fact}
                            </li>
                        ))}
                    </ul>
                    <CardLink href={OPEN_JOBS_URL}>Browse open jobs</CardLink>
                </HoverCard>

                <HoverCard
                    as="li"
                    lineClassName="bg-primary-300"
                    className="relative flex flex-col gap-4 overflow-hidden rounded-[10px] bg-primary-950 p-6 text-mist-100 lg:p-8"
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-20 -bottom-20 size-64 rounded-full bg-primary-500/15 blur-3xl"
                    />
                    <HoverCardIcon className="relative flex size-11 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
                        <Banknote className="size-5" strokeWidth={1.75} aria-hidden />
                    </HoverCardIcon>
                    <div className="relative flex flex-col gap-1">
                        <h3 className="text-base font-medium text-primary-300">{ACCELERATOR_PROGRAM_NAME}</h3>
                        <p className="text-sm font-light text-mist-300">Loans of up to</p>
                        <p className="text-4xl font-semibold tracking-tight text-white">{ACCELERATOR_LOAN_LABEL}</p>
                    </div>
                    <p className="relative text-base font-light text-mist-300">
                        Funding to invest in your workshop and take on bigger work.
                    </p>
                    <CardLink href={ACCELERATOR_URL} className="relative text-primary-300 hover:text-primary-200">
                        About the accelerator
                    </CardLink>
                </HoverCard>

                <HoverCard as="li" className={CARD_CLASS}>
                    <CardIcon icon={Factory} />
                    <h3 className="text-xl font-medium">Furniture machines</h3>
                    <p className="text-base font-light text-mist-700">
                        Book time on the country&apos;s top furniture machines at our Lagos factory. Anyone can book.
                        Members pay less.
                    </p>
                    <ul className="flex flex-wrap gap-2">
                        {FACTORY_WORK.map(({ icon: Icon, title }) => (
                            <li
                                key={title}
                                className="flex items-center gap-1.5 rounded-full bg-mist-100 px-3 py-1 text-sm text-mist-800"
                            >
                                <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                                {title}
                            </li>
                        ))}
                    </ul>
                    <CardLink href={MACHINES_URL}>See our furniture machines</CardLink>
                </HoverCard>

                <HoverCard as="li" className={CARD_CLASS}>
                    <CardIcon icon={UsersRound} />
                    <h3 className="text-xl font-medium">A community of makers</h3>
                    <p className="text-base font-light text-mist-700">
                        Job alerts and tips from other makers, and a support team on hand {SUPPORT_HOURS}.
                    </p>
                    <CardLink href={COMMUNITY_URL}>Join the community</CardLink>
                </HoverCard>

                <HoverCard as="li" className={CARD_CLASS}>
                    <CardIcon icon={UserRoundCheck} />
                    <h3 className="text-xl font-medium">Your wallet and officer</h3>
                    <p className="text-base font-light text-mist-700">
                        Every payment lands in your MANDE wallet, ready to withdraw. On the Workshop and Studio plans, a
                        dedicated officer knows your workshop and your jobs.
                    </p>
                    <CardLink href={`${FAQ_URL}#payments`}>How payments work</CardLink>
                </HoverCard>
            </ul>
        </SectionWrapper>
    );
}

/** Exactly how a job's pay is split, from the platform's own payment schedule, as a bar and its parts. */
function PaymentSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <span className="text-lg font-medium">How you&apos;re paid</span>
                    <SectionHeading as="h2">The money follows the work.</SectionHeading>
                </div>
                <p className="max-w-120 text-base font-light">
                    A job&apos;s pay comes in {JOB_PAYMENT_SCHEDULE.length} parts, each landing in your MANDE wallet the
                    moment it&apos;s earned.
                </p>
            </div>

            {/* The whole job's pay as one bar, each part sized by its share */}
            <div aria-hidden className="flex h-3 w-full gap-1 overflow-hidden rounded-full">
                {JOB_PAYMENT_SCHEDULE.map((payment, index) => (
                    <span
                        key={payment.milestone}
                        style={{ flexGrow: payment.percent }}
                        className={cn(
                            "basis-0",
                            ["bg-primary-200", "bg-primary-300", "bg-primary-400", "bg-primary-500", "bg-primary-700", "bg-primary-900"][
                                index % 6
                            ],
                        )}
                    />
                ))}
            </div>

            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {JOB_PAYMENT_SCHEDULE.map((payment, index) => (
                    <HoverCard
                        as="li"
                        key={payment.milestone}
                        className="flex flex-col gap-2 rounded-[10px] border border-border bg-white p-5"
                    >
                        <span className="font-mono text-xs font-semibold text-primary-700">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-3xl font-semibold tracking-tight">{payment.percent}%</span>
                        <span className="text-sm font-light text-mist-700">{payment.label}</span>
                    </HoverCard>
                ))}
            </ol>
            <p className="rounded-[10px] bg-primary-50 px-5 py-4 text-base font-light text-primary-950">
                <span className="font-medium">Plus a {JOB_BONUS_PERCENT}% bonus</span> on top of your labour when you
                deliver on time, with no stage sent back and no fault reported in the {FAULT_REPORT_DAYS} days after
                sign-off.
            </p>
        </SectionWrapper>
    );
}

/** Who MANDE is for: makers on one side, and on the other, anyone buying everyday furniture from the shop. */
function AudienceSection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
            <div className="flex max-w-175 flex-col gap-3">
                <span className="text-lg font-medium">Who MANDE is for</span>
                <SectionHeading as="h2">For the people who make furniture, and the people who need it.</SectionHeading>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <AudienceCard
                    icon={Hammer}
                    eyebrow="For furniture makers"
                    title="More work, paid on time, and room to grow."
                    points={FOR_MAKERS}
                    dark
                >
                    <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_ON_DARK_BUTTON}>
                        Create your profile
                    </Link>
                    <Link href={OPEN_JOBS_URL} className={WEBSITE_ON_DARK_OUTLINE_BUTTON}>
                        Browse open jobs
                    </Link>
                </AudienceCard>
                <AudienceCard
                    icon={ShoppingBag}
                    eyebrow={`${SHOP_NAME}, for homes and businesses`}
                    title="Everyday furniture at prices that make sense."
                    points={FOR_BUYERS}
                >
                    <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className={WEBSITE_PRIMARY_BUTTON}>
                        Visit the {SHOP_NAME}
                        <ArrowUpRight className="size-4" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                </AudienceCard>
            </div>
        </SectionWrapper>
    );
}

function AudienceCard({
    icon: Icon,
    eyebrow,
    title,
    points,
    dark = false,
    children,
}: {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    points: string[];
    dark?: boolean;
    /** The card's actions. */
    children: ReactNode;
}) {
    return (
        <HoverCard
            lineClassName={dark ? "bg-primary-300" : undefined}
            className={cn(
                "flex flex-col gap-6 rounded-[10px] p-6 md:p-10",
                dark ? "bg-primary-950 text-mist-100" : "bg-white",
            )}
        >
            <span
                className={cn(
                    "flex items-center gap-2 text-base font-medium",
                    dark ? "text-primary-300" : "text-primary-800",
                )}
            >
                <HoverCardIcon className="flex">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </HoverCardIcon>
                {eyebrow}
            </span>
            <h3 className={cn("text-2xl tracking-tight md:text-3xl", dark && "text-white")}>{title}</h3>
            <ul className="flex flex-1 flex-col gap-3">
                {points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-base font-light">
                        <span
                            className={cn(
                                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                                dark ? "bg-primary-500/20 text-primary-300" : "bg-primary-100 text-primary-800",
                            )}
                        >
                            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                        </span>
                        {point}
                    </li>
                ))}
            </ul>
            <div className={cn("flex flex-wrap gap-3 border-t pt-6", dark ? "border-white/10" : "border-border")}>
                {children}
            </div>
        </HoverCard>
    );
}

/** The brands makers on MANDE build for, then makers' own stories on video. */
function MakersSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col items-center gap-12 md:gap-16">
            <div className="flex w-full flex-col items-center gap-8 text-center">
                <span className="text-lg font-light">Makers on MANDE build furniture for leading brands</span>
                <div className="grid grid-cols-3 items-center gap-10 md:grid-cols-6">
                    {clientList.map((client) => (
                        <Image
                            key={client.id}
                            src={client.src}
                            alt={client.alt}
                            title={client.title}
                            width={client.width}
                            height={client.height}
                            className="max-w-20 object-cover object-center"
                        />
                    ))}
                </div>
            </div>

            <div className="flex w-full flex-col items-center gap-8 border-t border-border pt-12 md:pt-16">
                <div className="flex max-w-175 flex-col items-center gap-3 text-center">
                    <span className="text-lg font-medium">In their own words</span>
                    <SectionHeading as="h2">Hear it from the makers who build with us.</SectionHeading>
                </div>
                <VideoPlayer
                    src="https://www.mande.com.ng/media/hands-that-build.mp4"
                    className="aspect-video w-full max-w-3xl"
                />
            </div>
        </SectionWrapper>
    );
}
