import SectionHeading from "@/components/common/sectionHeading";
import SectionWrapper from "@/components/common/sectionWrapper";
import Image from "next/image";

type CardProps = {
    number: number;
    title: string;
    description: string;
    imageSrc: string;
};

const HIW_CONTENT = [
    {
        id: 1,
        imageSrc: "/images/image1.png",
        title: "Design",
        description:
            "Drawings and the bill of materials are agreed and filed against the job.",
    },
    {
        id: 2,
        imageSrc: "/images/image1.png",
        title: "Materials",
        description:
            "Timber and fittings bought out of the money held for this job, by you or by MANDE. Decided job by job.",
    },
    {
        id: 3,
        imageSrc: "/images/image1.png",
        title: "Frame",
        description:
            "The carcass is built. Photograph the joints before the carcass is closed.",
    },
    {
        id: 4,
        imageSrc: "/images/image1.png",
        title: "Assembly",
        description:
            "Components come together. Your officer compares them against the Frame photographs.",
    },
    {
        id: 5,
        imageSrc: "/images/image1.png",
        title: "Finishing",
        description:
            "Sanding, staining, lacquer. Shoot finishing in daylight so the colour reads true.",
    },
    {
        id: 6,
        imageSrc: "/images/image1.png",
        title: "Delivery",
        description:
            "Signed off by the customer at their address. Your balance follows once the defect window closes.",
    },
];

export default function HowItWorks() {
    return (
        <SectionWrapper
            className="bg-mist-200"
            containerClassName="flex flex-col items-start gap-8 md:gap-12"
        >
            <div className="max-w-175">
                <SectionHeading>
                    A smarter way to get furniture works, grow, and earn more.
                </SectionHeading>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 w-full">
                {HIW_CONTENT.map((item) => (
                    <Card
                        key={item.id}
                        number={item.id}
                        title={item.title}
                        description={item.description}
                        imageSrc={item.imageSrc}
                    />
                ))}
            </div>
        </SectionWrapper>
    );
}

const Card = ({ number, title, description, imageSrc }: CardProps) => {
    return (
        <div className="relative aspect-9/12 w-full rounded-[10px] overflow-hidden group">
            <Image
                src={imageSrc}
                alt={title}
                title={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-110 duration-300 transition-transform ease-in-out"
            />
            <div className="absolute inset-0 bg-mist-950/50 p-4 md:p-6 group-hover:backdrop-blur-sm group-hover:bg-mist-950/70 duration-300 transition-all ease-in-out">
                <span className="text-4xl font-bold text-mist-100">
                    {String(number).padStart(2, "0")}
                </span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 text-mist-100 flex flex-col gap-1.5 z-10">
                <h4 className="text-lg md:text-2xl font-normal uppercase tracking-wide">
                    {title}
                </h4>
                <p className="font-light text-base text-mist-100">
                    {description}
                </p>
            </div>
        </div>
    );
};