import Image from "next/image";
import Link from "next/link";
import { Factory } from "lucide-react";
import { SERVICES_URL } from "@/constant/navigation";
import { NOT_INCLUDED, PRICING_PLANS } from "@/constant/sampleData";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

// The plans with machine access, and their discount — the pricing section's "Easy access to top machinery" row
const MACHINE_DISCOUNTS = PRICING_PLANS.flatMap((plan) => {
    const value = plan.features.find((feature) => feature.label === "Easy access to top machinery")?.value;
    return value && value !== NOT_INCLUDED ? [{ id: plan.id, name: plan.name, value }] : [];
});

/** Machine access at the Lagos factory — the lead service, with a way to the Services page. */
export default function FactorySection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
            <div className="flex-1">
                <Image
                    src="/images/carpenter_working.png"
                    alt="A furniture maker at work"
                    width={1000}
                    height={667}
                    className="aspect-1000/667 w-full rounded-[10px] object-cover object-center"
                />
            </div>
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <span className="flex items-center gap-2 text-lg font-medium">
                        <Factory className="size-5 text-primary-800" strokeWidth={1.75} aria-hidden />
                        Machine access
                    </span>
                    <SectionHeading as="h2">Build bigger at our Lagos factory.</SectionHeading>
                    <p className="text-base font-light">
                        Members book time on the country&apos;s top furniture machines at the MANDE factory in Lagos, so you
                        can take on bigger, more precise jobs without buying the equipment yourself.
                    </p>
                </div>
                {MACHINE_DISCOUNTS.length > 0 && (
                    <ul className="flex flex-wrap gap-3">
                        {MACHINE_DISCOUNTS.map((plan) => (
                            <li key={plan.id} className="rounded-full bg-white px-4 py-1.5 text-sm">
                                <span className="font-medium text-primary-900">{plan.value}</span>{" "}
                                <span className="font-light text-mist-700">on {plan.name}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={`${SERVICES_URL}#machine-access`} className={WEBSITE_PRIMARY_BUTTON}>
                        Explore machine access
                    </Link>
                    <Link href={SERVICES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                        See all services
                    </Link>
                </div>
            </div>
        </SectionWrapper>
    );
}
