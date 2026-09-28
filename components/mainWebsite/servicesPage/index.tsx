import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    BriefcaseBusiness,
    CalendarCheck,
    Factory,
    Hammer,
    Headset,
    Layers,
    Paintbrush,
    Ruler,
    UserRoundCheck,
    UsersRound,
    WalletMinimal,
    type LucideIcon,
} from "lucide-react";
import { JOB_BONUS_PERCENT, JOB_PAYMENT_SCHEDULE } from "@/constant/jobWorkflow";
import { COMMUNITY_URL, CONTACT_URL, FAQ_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import { NOT_INCLUDED, PRICING_PLANS } from "@/constant/sampleData";
import { SUPPORT_HOURS } from "@/constant/support";
import CtaBand from "../common/ctaBand";
import PageHero from "../common/pageHero";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

const MACHINE_ACCESS_ID = "machine-access";

const SERVICES: { icon: LucideIcon; title: string; description: string; link: { label: string; href: string } }[] = [
    {
        icon: Factory,
        title: "Top machines at our Lagos factory",
        description:
            "Book time on the country's top furniture machines at the MANDE factory in Lagos, at a member discount on the Workshop and Studio plans.",
        link: { label: "How machine access works", href: `#${MACHINE_ACCESS_ID}` },
    },
    {
        icon: BriefcaseBusiness,
        title: "Paid furniture jobs",
        description: `Apply for real furniture projects and get paid in ${JOB_PAYMENT_SCHEDULE.length} parts as each stage is approved, plus a ${JOB_BONUS_PERCENT}% bonus for work delivered on time.`,
        link: { label: "Browse open jobs", href: OPEN_JOBS_URL },
    },
    {
        icon: WalletMinimal,
        title: "Your MANDE wallet",
        description: "Every payment lands in your balance the moment it's earned. Withdraw to your bank account whenever you like.",
        link: { label: "Read about payments", href: `${FAQ_URL}#payments` },
    },
    {
        icon: UserRoundCheck,
        title: "A dedicated officer",
        description: "Someone at MANDE who knows your workshop and your jobs, on the Workshop and Studio plans.",
        link: { label: "Talk to us", href: CONTACT_URL },
    },
    {
        icon: UsersRound,
        title: "The MANDE community",
        description: "Job alerts on WhatsApp, tips from other makers, and finished pieces worth learning from.",
        link: { label: "Join the community", href: COMMUNITY_URL },
    },
    {
        icon: Headset,
        title: "Support when you need it",
        description: `Chat with our team ${SUPPORT_HOURS}, or find quick answers in the FAQs.`,
        link: { label: "Read the FAQs", href: FAQ_URL },
    },
];

const FACTORY_WORK: { icon: LucideIcon; title: string; description: string }[] = [
    { icon: Ruler, title: "Cut and shape", description: "Panels and parts cut and shaped with precision, ready to join." },
    { icon: Layers, title: "Join and assemble", description: "Room and equipment for bigger pieces than most workshops can take." },
    { icon: Paintbrush, title: "Sand and finish", description: "An even, showroom-standard finish on every surface." },
];

const BOOKING_STEPS: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: UserRoundCheck,
        title: "Be a member",
        description: "Machine access comes with the Workshop and Studio plans, each with its own discount.",
    },
    {
        icon: CalendarCheck,
        title: "Book your time",
        description: "Tell your dedicated officer, or contact us, what you're making and when you'd like to come in.",
    },
    {
        icon: Hammer,
        title: "Build at the factory",
        description: "Bring your drawings and materials. Our team at the factory gets you set up.",
    },
];

// What each plan gets at the factory, from the plans' own features — the
// same "Easy access to top machinery" row the pricing section shows
const MACHINE_ACCESS_BY_PLAN = PRICING_PLANS.map((plan) => {
    const value = plan.features.find((feature) => feature.label === "Easy access to top machinery")?.value;
    const isIncluded = !!value && value !== NOT_INCLUDED;
    return { id: plan.id, name: plan.name, isIncluded, detail: isIncluded ? `${value} machine time` : NOT_INCLUDED };
});

// ─────────────────────────────────────────────────────────────────────────────
// Services — what MANDE gives its makers, led by access to the country's top
// furniture machines at the Lagos factory: what members can do there, what
// each plan includes, and how to book. Then the sign-up band.
// ─────────────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
    return (
        <>
            <PageHero
                eyebrow="Services"
                title="Everything a furniture maker needs to grow."
                description="Real jobs paid in stages, the country's top furniture machines at our Lagos factory, and a team behind you at every step."
            >
                <Link href={`#${MACHINE_ACCESS_ID}`} className={WEBSITE_PRIMARY_BUTTON}>
                    Explore machine access
                </Link>
                <Link href={OPEN_JOBS_URL} className={WEBSITE_OUTLINE_BUTTON}>
                    Browse open jobs
                </Link>
            </PageHero>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-12">
                <SectionHeading as="h2" className="max-w-175">
                    What you get with MANDE.
                </SectionHeading>
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {SERVICES.map(({ icon: Icon, title, description, link }) => (
                        <li key={title} className="flex flex-col gap-4 rounded-[10px] border border-border bg-white p-6 lg:p-8">
                            <span className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                            </span>
                            <h3 className="text-xl font-medium">{title}</h3>
                            <p className="flex-1 text-base font-light text-mist-700">{description}</p>
                            <Link
                                href={link.href}
                                className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary-800 hover:text-primary-950"
                            >
                                {link.label}
                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                            </Link>
                        </li>
                    ))}
                </ul>
            </SectionWrapper>

            <SectionWrapper
                id={MACHINE_ACCESS_ID}
                className="scroll-mt-16 bg-mist-200"
                containerClassName="flex flex-col gap-12 md:gap-16"
            >
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
                    <div className="flex flex-1 flex-col gap-4">
                        <span className="text-lg font-medium">Machine access</span>
                        <SectionHeading as="h2">The country&apos;s top furniture machines, at our Lagos factory.</SectionHeading>
                        <p className="text-base font-light">
                            Not every workshop can own the machines that big jobs need. As a MANDE member you can book time
                            on them at our factory in Lagos, and take on bigger, more precise work without buying the
                            equipment yourself.
                        </p>
                    </div>
                    <div className="flex-1">
                        <Image
                            src="/images/carpenter_working.png"
                            alt="A furniture maker at work"
                            width={1000}
                            height={667}
                            className="aspect-1000/667 w-full rounded-[10px] object-cover object-center"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <h3 className="text-2xl tracking-tight md:text-3xl">What you can do there</h3>
                    <ul className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
                        {FACTORY_WORK.map(({ icon: Icon, title, description }) => (
                            <li key={title} className="flex gap-4 rounded-[10px] bg-white p-6">
                                <Icon className="mt-0.5 size-6 shrink-0 text-primary-800" strokeWidth={1.5} aria-hidden />
                                <div className="flex flex-col gap-1">
                                    <p className="text-lg font-medium">{title}</p>
                                    <p className="text-base font-light text-mist-700">{description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-6">
                    <h3 className="text-2xl tracking-tight md:text-3xl">Access by plan</h3>
                    <ul className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
                        {MACHINE_ACCESS_BY_PLAN.map((plan) => (
                            <li
                                key={plan.id}
                                className={
                                    plan.isIncluded
                                        ? "flex flex-col gap-1 rounded-[10px] border border-primary-300 bg-white p-6"
                                        : "flex flex-col gap-1 rounded-[10px] border border-border bg-white/60 p-6"
                                }
                            >
                                <p className="text-sm font-light text-mist-600">{plan.name}</p>
                                <p className={plan.isIncluded ? "text-2xl font-medium text-primary-900" : "text-2xl font-light text-mist-500"}>
                                    {plan.detail}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-6">
                    <h3 className="text-2xl tracking-tight md:text-3xl">How to book</h3>
                    <ol className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
                        {BOOKING_STEPS.map(({ icon: Icon, title, description }, index) => (
                            <li key={title} className="flex flex-col gap-4 rounded-[10px] bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <span className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-primary-700">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </div>
                                <p className="text-xl font-medium">{title}</p>
                                <p className="text-base font-light text-mist-700">{description}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </SectionWrapper>

            <CtaBand
                title="Ready to build bigger?"
                description="Join MANDE on the Workshop or Studio plan for machine time at our Lagos factory, or start with the jobs."
                secondaryLink={{ label: "Contact us", href: CONTACT_URL }}
            />
        </>
    );
}
