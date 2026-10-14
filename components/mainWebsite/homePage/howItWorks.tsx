import Image from "next/image";
import { Blocks, Hammer, Package, Paintbrush, PencilRuler, Truck, Wallet, type LucideIcon } from "lucide-react";
import { JOB_PAYMENT_SCHEDULE, JOB_PRODUCTION_STEPS, type ProductionStepKey } from "@/constant/jobWorkflow";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import HoverCard, { HoverCardIcon } from "../common/hoverCard";

const percentAt = (milestone: (typeof JOB_PAYMENT_SCHEDULE)[number]["milestone"]) =>
    JOB_PAYMENT_SCHEDULE.find((payment) => payment.milestone === milestone)?.percent ?? 0;

type Stage = {
    icon: LucideIcon;
    description: string;
    pay: string;
    /** A photo of the stage, from /public (e.g. "/images/steps/design.jpg"). Until one is set, a placeholder shows. */
    image?: string;
};

// Each stage's work, and what's paid around it (from JOB_PAYMENT_SCHEDULE)
const STAGES: Record<ProductionStepKey, Stage> = {
    design: {
        icon: PencilRuler,
        image: `/images/webpage/Furniture_technical_drawings_on_…_20261014184542.webp`,
        description: "You and your project lead agree the drawings and the bill of materials before any wood is cut.",
        pay: `${percentAt("accepted")}% paid when you accept the job`,
    },
    materials: {
        icon: Package,
        image: `/images/webpage/Furniture_maker_checking_wood_ma…_20261014185450.webp`,
        description: "Timber and fittings are bought from the money set aside for the job, by you or by MANDE, decided job by job.",
        pay: "Covered by the job's materials budget",
    },
    frame: {
        icon: Hammer,
        image: `/images/webpage/Craftsperson_photographing_wood_…_20261014185809.webp`,
        description: "Build the carcass and photograph the joints before it's closed, so the structure can be checked.",
        pay: `${percentAt("frame")}% when it's approved`,
    },
    assembly: {
        icon: Blocks,
        image: `/images/webpage/Craftspeople_building_wooden_sid…_20261014190244.webp`,
        description: "The parts come together and are checked against the Frame photos and the drawing.",
        pay: `${percentAt("assembly")}% when it's approved`,
    },
    finishing: {
        icon: Paintbrush,
        image: `/images/webpage/Furniture_maker_staining_wood_si…_20261014190519.webp`,
        description: "Sanding, staining and lacquer. Shoot in daylight so the colour reads true.",
        pay: `${percentAt("finishing")}% when it's approved`,
    },
    delivery: {
        icon: Truck,
        image: `/images/webpage/Workers_delivering_wooden_sideboard_20261014191250.webp`,
        description: "The piece is delivered and the customer signs it off at their address.",
        pay: `${percentAt("delivery")}% at delivery, ${percentAt("signed-off")}% at sign-off`,
    },
};

/** The six stages every job moves through: a photo of each, what's done, and what's paid. */
export default function HowItWorks() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="flex max-w-175 flex-col gap-3">
                    <span className="text-lg font-medium">How a job works</span>
                    <SectionHeading as="h2">From drawing to doorstep, paid at every step.</SectionHeading>
                </div>
                <p className="max-w-120 text-base font-light">
                    Every job moves through {JOB_PRODUCTION_STEPS.length} stages. Prove each one with photos, your project
                    lead approves it, and your payment follows.
                </p>
            </div>
            <ol className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {JOB_PRODUCTION_STEPS.map((step, index) => {
                    const stage = STAGES[step.key];
                    return (
                        <HoverCard as="li" key={step.key} className="flex flex-col overflow-hidden rounded-[10px] bg-white">
                            <StageImage stage={stage} label={step.label} number={index + 1} />
                            <div className="flex flex-1 flex-col gap-3 p-6">
                                <h3 className="text-xl font-medium">{step.label}</h3>
                                <p className="flex-1 text-base font-light text-mist-700">{stage.description}</p>
                                <p className="flex items-center gap-2 border-t border-mist-200 pt-4 text-sm font-medium text-primary-800">
                                    <Wallet className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                                    {stage.pay}
                                </p>
                            </div>
                        </HoverCard>
                    );
                })}
            </ol>
        </SectionWrapper>
    );
}

/** The stage's photo, or a placeholder in its place until one is added, with the step number over it. */
function StageImage({ stage, label, number }: { stage: Stage; label: string; number: number }) {
    const { icon: Icon, image } = stage;
    return (
        <div className="relative aspect-4/3 w-full overflow-hidden bg-mist-100">
            {image ? (
                <Image
                    src={image}
                    alt={`The ${label} stage of a MANDE job`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center"
                />
            ) : (
                <div
                    aria-hidden
                    className="flex h-full w-full items-center justify-center bg-[radial-gradient(var(--color-mist-300)_1px,transparent_1px)] bg-size-[16px_16px]"
                >
                    <HoverCardIcon className="flex size-16 items-center justify-center rounded-full bg-white text-primary-800 shadow-xs">
                        <Icon className="size-7" strokeWidth={1.5} />
                    </HoverCardIcon>
                </div>
            )}
            <span className="absolute top-4 left-4 rounded-md bg-white/90 px-2 py-1 font-mono text-sm font-semibold text-primary-800 backdrop-blur-sm">
                {String(number).padStart(2, "0")}
            </span>
        </div>
    );
}
