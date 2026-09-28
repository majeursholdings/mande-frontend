import { Blocks, Hammer, Package, Paintbrush, PencilRuler, Truck, type LucideIcon } from "lucide-react";
import { JOB_PAYMENT_SCHEDULE, JOB_PRODUCTION_STEPS, type ProductionStepKey } from "@/constant/jobWorkflow";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";

const percentAt = (milestone: (typeof JOB_PAYMENT_SCHEDULE)[number]["milestone"]) =>
    JOB_PAYMENT_SCHEDULE.find((payment) => payment.milestone === milestone)?.percent ?? 0;

// Each stage's work, and what's paid around it (from JOB_PAYMENT_SCHEDULE)
const STAGES: Record<ProductionStepKey, { icon: LucideIcon; description: string; pay: string }> = {
    design: {
        icon: PencilRuler,
        description: "Drawings and the bill of materials are agreed and filed against the job.",
        pay: `${percentAt("accepted")}% paid when you accept the job`,
    },
    materials: {
        icon: Package,
        description: "Timber and fittings are bought out of the money held for this job, by you or by MANDE, decided job by job.",
        pay: "Paid for from the job's materials money",
    },
    frame: {
        icon: Hammer,
        description: "The carcass is built. Photograph the joints before the carcass is closed.",
        pay: `${percentAt("frame")}% when it's approved`,
    },
    assembly: {
        icon: Blocks,
        description: "Components come together, checked against the Frame photographs.",
        pay: `${percentAt("assembly")}% when it's approved`,
    },
    finishing: {
        icon: Paintbrush,
        description: "Sanding, staining, lacquer. Shoot finishing in daylight so the colour reads true.",
        pay: `${percentAt("finishing")}% when it's approved`,
    },
    delivery: {
        icon: Truck,
        description: "Signed off by the customer at their address.",
        pay: `${percentAt("delivery")}% at delivery, ${percentAt("signed-off")}% at sign-off`,
    },
};

/** The six stages every job moves through — what's done at each, and what's paid. */
export default function HowItWorks() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
            <div className="flex max-w-175 flex-col gap-3">
                <SectionHeading as="h2">A smarter way to get furniture work, grow and earn more.</SectionHeading>
                <p className="text-base font-light">
                    Every job moves through {JOB_PRODUCTION_STEPS.length} stages. You prove each one with photos, and
                    you&apos;re paid as they&apos;re approved.
                </p>
            </div>
            <ol className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {JOB_PRODUCTION_STEPS.map((step, index) => {
                    const { icon: Icon, description, pay } = STAGES[step.key];
                    return (
                        <li key={step.key} className="flex flex-col gap-4 rounded-[10px] bg-white p-6 lg:p-8">
                            <div className="flex items-center justify-between">
                                <span className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                                </span>
                                <span className="font-mono text-sm font-semibold text-primary-700">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </div>
                            <h3 className="text-xl font-medium">{step.label}</h3>
                            <p className="flex-1 text-base font-light text-mist-700">{description}</p>
                            <p className="w-fit rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-900">{pay}</p>
                        </li>
                    );
                })}
            </ol>
        </SectionWrapper>
    );
}
