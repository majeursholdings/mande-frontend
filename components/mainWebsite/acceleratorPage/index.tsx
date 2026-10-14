import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Banknote,
    BookOpenCheck,
    CalendarCheck,
    Check,
    FileText,
    Headset,
    PiggyBank,
    Sparkles,
    Star,
    TrendingUp,
    Trophy,
    type LucideIcon,
} from "lucide-react";
import {
    ACCELERATOR_LOAN_LABEL,
    ACCELERATOR_PROGRAM_NAME,
    ACCELERATOR_QUALIFYING_RANK_IDS,
} from "@/constant/accelerator";
import { MANUFACTURER_POINTS_URL } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL, CONTACT_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import { MANUFACTURER_RANKS } from "@/constant/points";
import CtaBand from "../common/ctaBand";
import PageHero from "../common/pageHero";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import HoverCard, { HoverCardIcon } from "../common/hoverCard";
import RankLadder from "./rankLadder";
import {
    WEBSITE_ON_DARK_BUTTON,
    WEBSITE_ON_DARK_OUTLINE_BUTTON,
    WEBSITE_OUTLINE_BUTTON,
    WEBSITE_PRIMARY_BUTTON,
} from "../common/buttonStyles";

/** The ranks that qualify easily, by name: "Expert Maker or Master Craftsman". */
const QUALIFYING_RANKS = MANUFACTURER_RANKS.filter((rank) => ACCELERATOR_QUALIFYING_RANK_IDS.includes(rank.id))
    .map((rank) => rank.name)
    .join(" or ");

/** Logging in from the website lands on the maker's points page, where their rank shows. */
const SEE_YOUR_RANK_URL = `${ARTISAN_LOGIN_URL}?next=${encodeURIComponent(MANUFACTURER_POINTS_URL)}`;

// What moves a maker up the ranks, in everyday words
const CLIMB_TIPS: { icon: LucideIcon; title: string; description: string }[] = [
    { icon: CalendarCheck, title: "Finish jobs on time", description: "Every job you complete and deliver on time counts." },
    { icon: Check, title: "Get it right first time", description: "Stages approved without being sent back earn you more." },
    { icon: Star, title: "Earn good ratings", description: "Happy customers and good reviews push you up." },
    { icon: Sparkles, title: "Keep a clean record", description: "Faults and rejected work take points away." },
];

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: Trophy,
        title: "Rank high on MANDE",
        description: `Do good work on your jobs and climb the ranks. Reach ${QUALIFYING_RANKS} and you qualify easily.`,
    },
    {
        icon: BookOpenCheck,
        title: "Get ready with us",
        description: "Short sessions on understanding your loan, saving, and keeping simple business records.",
    },
    {
        icon: FileText,
        title: "Apply with our help",
        description: "We help you put your papers together and check everything before it's sent.",
    },
    {
        icon: TrendingUp,
        title: "Grow your workshop",
        description: "Use the money to buy tools, materials or space, take on bigger jobs and pay back on time.",
    },
];

const NEEDS: { title: string; description: string }[] = [
    { title: "A high rank on MANDE", description: `Makers ranked ${QUALIFYING_RANKS} qualify easily.` },
    { title: "Some savings", description: "About 10% of the loan, set aside. We'll help you build it." },
    { title: "Your ID and business details", description: "We'll help you get them in order." },
];

// ─────────────────────────────────────────────────────────────────────────────
// The MANDE Accelerator Program: loans for makers, in plain words. What it
// is, who can apply (makers who rank high: the rank ladder and how to climb
// it, and the ranks that qualify easily), how it works, what you'll need, the help on offer, and the sign-up
// band. Kept light on purpose: the details are for the team to explain.
// ─────────────────────────────────────────────────────────────────────────────

export default function AcceleratorPage() {
    return (
        <>
            <PageHero
                eyebrow={ACCELERATOR_PROGRAM_NAME}
                title="Money to grow your workshop."
                description={`Loans of up to ${ACCELERATOR_LOAN_LABEL} for makers who do great work on MANDE. We help you get ready, apply and make the most of it.`}
            >
                <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_PRIMARY_BUTTON}>
                    Create your profile
                </Link>
                <Link href={SEE_YOUR_RANK_URL} className={WEBSITE_OUTLINE_BUTTON}>
                    See your rank
                </Link>
            </PageHero>

            <IntroSection />
            <RankSection />
            <StepsSection />
            <NeedsSection />

            <CtaBand
                title="Start building your rank today."
                description="Every job you finish well moves you closer to a loan. Create your profile and take on your first job."
            />
        </>
    );
}

/** What the programme is, in a few lines, beside the loan amount. */
function IntroSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
            <div className="flex flex-1 flex-col gap-4">
                <span className="text-lg font-medium">What it is</span>
                <SectionHeading as="h2" className="max-w-175">
                    Good work should open doors.
                </SectionHeading>
                <p className="text-base font-light">
                    Many makers have the skill for bigger jobs but not the money for the tools, materials or space. The{" "}
                    {ACCELERATOR_PROGRAM_NAME} helps close that gap.
                </p>
                <p className="text-base font-light">
                    It rewards the makers who do the best work on MANDE with a loan to grow, plus the training and
                    support to use it well and pay it back.
                </p>
            </div>
            <div className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-[10px] bg-primary-950">
                <Image
                    src="/images/carpenter_working.png"
                    alt=""
                    width={1000}
                    height={667}
                    className="aspect-1000/667 w-full object-cover object-center opacity-40"
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-primary-950 via-primary-950/80 to-transparent p-6 pt-16 md:p-8 md:pt-20">
                    <span className="flex items-center gap-2 text-sm font-medium text-primary-300">
                        <Banknote className="size-4.5" strokeWidth={1.75} aria-hidden />
                        Loans of up to
                    </span>
                    <span className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
                        {ACCELERATOR_LOAN_LABEL}
                    </span>
                </div>
            </div>
        </SectionWrapper>
    );
}

/** Who can apply: the rank ladder (animated, rising left to right), and what moves a maker up it. */
function RankSection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-10 md:gap-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <span className="text-lg font-medium">Who can apply</span>
                    <SectionHeading as="h2">Rank high, and you qualify.</SectionHeading>
                </div>
                <p className="max-w-120 text-base font-light">
                    Every maker on MANDE has a rank, and it goes up as you do good work. Reach {QUALIFYING_RANKS} and you
                    qualify easily.
                </p>
            </div>

            <RankLadder qualifyingLabel={QUALIFYING_RANKS} />

            <div className="flex flex-col gap-6">
                <h3 className="text-2xl tracking-tight md:text-3xl">How to move up</h3>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                    {CLIMB_TIPS.map(({ icon: Icon, title, description }) => (
                        <li key={title} className="flex flex-col gap-3 border-t border-mist-300 pt-6">
                            <Icon className="size-6 text-primary-800" strokeWidth={1.5} aria-hidden />
                            <p className="text-lg font-medium">{title}</p>
                            <p className="text-base font-light text-mist-700">{description}</p>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link href={OPEN_JOBS_URL} className={WEBSITE_PRIMARY_BUTTON}>
                        Find a job to start on
                    </Link>
                    <Link
                        href={SEE_YOUR_RANK_URL}
                        className="group inline-flex items-center gap-1.5 text-base font-medium text-primary-800 hover:text-primary-950"
                    >
                        Already on MANDE? See your rank
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                    </Link>
                </div>
            </div>
        </SectionWrapper>
    );
}

/** How it works, from rank to loan, as four numbered steps. */
function StepsSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-12">
            <div className="flex max-w-175 flex-col gap-3">
                <span className="text-lg font-medium">How it works</span>
                <SectionHeading as="h2">Four steps from good work to a loan.</SectionHeading>
            </div>
            <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {STEPS.map(({ icon: Icon, title, description }, index) => (
                    <HoverCard
                        as="li"
                        key={title}
                        className="flex flex-col gap-4 rounded-[10px] border border-border bg-white p-6"
                    >
                        <div className="flex items-center justify-between">
                            <HoverCardIcon className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                            </HoverCardIcon>
                            <span className="font-mono text-xs font-semibold tracking-wider text-primary-700">
                                STEP {String(index + 1).padStart(2, "0")}
                            </span>
                        </div>
                        <h3 className="text-xl font-medium">{title}</h3>
                        <p className="text-base font-light text-mist-700">{description}</p>
                    </HoverCard>
                ))}
            </ol>
        </SectionWrapper>
    );
}

/** What a maker needs, beside the help they get along the way. */
function NeedsSection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="flex flex-col gap-8 lg:col-span-3">
                <div className="flex flex-col gap-3">
                    <span className="text-lg font-medium">What you&apos;ll need</span>
                    <SectionHeading as="h2">Not much, and we help with all of it.</SectionHeading>
                </div>
                <ul className="flex flex-col gap-3">
                    {NEEDS.map(({ title, description }) => (
                        <HoverCard
                            as="li"
                            key={title}
                            className="flex items-start gap-4 rounded-[10px] bg-white p-5"
                        >
                            <HoverCardIcon className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                                <Check className="size-4" strokeWidth={2.5} aria-hidden />
                            </HoverCardIcon>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-lg font-medium">{title}</p>
                                <p className="text-base font-light text-mist-700">{description}</p>
                            </div>
                        </HoverCard>
                    ))}
                </ul>
            </div>

            <HoverCard
                lineClassName="bg-primary-300"
                className="flex flex-col gap-6 self-start rounded-[10px] bg-primary-950 p-6 text-mist-100 md:p-8 lg:col-span-2"
            >
                <HoverCardIcon className="flex size-11 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
                    <Headset className="size-5" strokeWidth={1.75} aria-hidden />
                </HoverCardIcon>
                <div className="flex flex-col gap-3">
                    <p className="text-2xl tracking-tight text-white">You won&apos;t do it alone.</p>
                    <p className="text-base font-light text-mist-300">
                        A MANDE officer walks you through each step. And if anything goes wrong along the way, you&apos;ll
                        have someone to talk to who will sort it out.
                    </p>
                </div>
                <ul className="flex flex-col gap-3 border-t border-white/10 pt-6">
                    {[
                        { icon: PiggyBank, label: "Help building your savings" },
                        { icon: FileText, label: "Help with your papers" },
                        { icon: BookOpenCheck, label: "Simple training before you borrow" },
                    ].map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-3 text-base font-light">
                            <Icon className="size-4.5 shrink-0 text-primary-300" strokeWidth={1.75} aria-hidden />
                            {label}
                        </li>
                    ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                    <Link href={CONTACT_URL} className={WEBSITE_ON_DARK_BUTTON}>
                        Ask us a question
                    </Link>
                    <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_ON_DARK_OUTLINE_BUTTON}>
                        Join MANDE
                    </Link>
                </div>
            </HoverCard>
        </SectionWrapper>
    );
}
