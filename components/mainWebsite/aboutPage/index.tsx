import Image from "next/image";
import Link from "next/link";
import { Building2, Camera, TrendingUp, WalletMinimal, type LucideIcon } from "lucide-react";
import { clientList } from "@/constant/global";
import {
    FAULT_REPORT_DAYS,
    JOB_BONUS_PERCENT,
    JOB_PAYMENT_SCHEDULE,
    MAX_STEP_PROOF_PHOTOS,
    REVIEW_WINDOW_HOURS,
} from "@/constant/jobWorkflow";
import { ARTISAN_SIGNUP_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import CtaBand from "../common/ctaBand";
import PageHero from "../common/pageHero";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

const FIRST_PAYMENT = JOB_PAYMENT_SCHEDULE[0];

const VALUES: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: WalletMinimal,
        title: "Paid as you work",
        description: `${FIRST_PAYMENT.percent}% the day you accept a job, then a share at every approved stage — never a wait until the very end.`,
    },
    {
        icon: Camera,
        title: "Proof at every stage",
        description: `Up to ${MAX_STEP_PROOF_PHOTOS} photos per stage, checked against the drawing for the job — and approved automatically if no one reviews them within ${REVIEW_WINDOW_HOURS} hours.`,
    },
    {
        icon: Building2,
        title: "Real jobs, real customers",
        description: "Furniture projects from the brands and customers who build with MANDE — not one-off favours.",
    },
    {
        icon: TrendingUp,
        title: "Tools to grow",
        description: "Discounts on top machinery and a dedicated officer on the Workshop and Studio plans, as your team grows.",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// About MANDE — who it's for and why it exists, what sets it apart, exactly
// how a job's pay is split (from the platform's own payment schedule), the
// brands makers build for, and the sign-up band.
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
    return (
        <>
            <PageHero
                eyebrow="About MANDE"
                title="Built for the people who build furniture."
                description="MANDE is a platform for furniture makers and woodworkers — to find real jobs, show their best work, and grow from local customers to an international audience."
            >
                <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_PRIMARY_BUTTON}>
                    Create your profile
                </Link>
                <Link href={OPEN_JOBS_URL} className={WEBSITE_OUTLINE_BUTTON}>
                    Browse open jobs
                </Link>
            </PageHero>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
                <div className="flex flex-1 flex-col gap-4">
                    <span className="text-lg font-medium">Why we built MANDE</span>
                    <SectionHeading as="h2" className="max-w-175">
                        The money should follow the work.
                    </SectionHeading>
                    <p className="text-base font-light">
                        Furniture makers do their best work when they aren&apos;t chasing payment. On MANDE, every job is
                        paid in stages as it&apos;s built — an advance when you accept it, a share at each approved stage,
                        and the balance at sign-off.
                    </p>
                    <p className="text-base font-light">
                        Each stage is proved with photographs and checked by a project lead against the drawing for that
                        job, so customers get exactly what they ordered and makers get paid on time — with the payment
                        protected from the first cut.
                    </p>
                </div>
                <div className="flex-1">
                    <Image
                        src="/images/carpenter_working.png"
                        alt="A furniture maker at work in a workshop"
                        width={1000}
                        height={667}
                        className="aspect-1000/667 w-full rounded-[10px] object-cover object-center"
                    />
                </div>
            </SectionWrapper>

            <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
                <SectionHeading as="h2" className="max-w-175">
                    What makes MANDE different.
                </SectionHeading>
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                    {VALUES.map(({ icon: Icon, title, description }) => (
                        <li key={title} className="flex flex-col gap-4 rounded-[10px] bg-white p-6">
                            <span className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                            </span>
                            <h3 className="text-xl font-medium">{title}</h3>
                            <p className="text-base font-light text-mist-700">{description}</p>
                        </li>
                    ))}
                </ul>
            </SectionWrapper>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <SectionHeading as="h2">How you&apos;re paid on every job.</SectionHeading>
                    <p className="text-base font-light">
                        A job&apos;s pay comes in {JOB_PAYMENT_SCHEDULE.length} parts, each landing in your MANDE balance the
                        moment it&apos;s earned.
                    </p>
                </div>
                <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {JOB_PAYMENT_SCHEDULE.map((payment, index) => (
                        <li
                            key={payment.milestone}
                            className="flex flex-col gap-2 rounded-[10px] border border-border bg-white p-5"
                        >
                            <span className="font-mono text-xs font-semibold text-primary-700">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-3xl font-semibold tracking-tight">{payment.percent}%</span>
                            <span className="text-sm font-light text-mist-700">{payment.label}</span>
                        </li>
                    ))}
                </ol>
                <p className="rounded-[10px] bg-primary-50 px-5 py-4 text-base font-light text-primary-950">
                    <span className="font-medium">Plus a {JOB_BONUS_PERCENT}% bonus</span> on top of your labour when you
                    deliver on time, with no stage sent back and no fault reported in the {FAULT_REPORT_DAYS} days after
                    sign-off.
                </p>
            </SectionWrapper>

            <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col items-center gap-8 text-center">
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
            </SectionWrapper>

            <CtaBand />
        </>
    );
}
