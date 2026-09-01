import SectionHeading from "@/components/common/sectionHeading"
import SectionWrapper from "@/components/common/sectionWrapper"
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation"
import Image from "next/image"
import Link from "next/link"

export default function AboutSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-5 md:gap-10">
            <div className="flex-1 space-y-6">
                <div className="space-y-3">
                    <span className="text-lg font-medium">
                        Get money before you work!
                    </span>
                    <SectionHeading className="max-w-175">
                        Craftsmanship, elevated by community.
                    </SectionHeading>
                    <p className="font-light text-base">
                        Artisans on MANDE are paid an advance before work
                        starts, again at the Assembly milestone, and the balance
                        once the job is signed off. You take on real furniture
                        projects and prove each stage with photographs checked
                        against the drawing for that job, with the payment
                        protected from the first cut.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-start">
                    <Link
                        href={"/"}
                        title={"Learn how it works"}
                        className="flex flex-1 justify-center text-nowrap w-fit rounded-xs py-1.5 px-5 border bg-primary-950 border-primary-950 text-mist-100 hover:bg-primary-500 hover:border-primary-500 hover:text-primary-950 duration-300 transition-all"
                    >
                        Learn how it works
                    </Link>
                    <Link
                        href={ARTISAN_SIGNUP_URL}
                        title="Start registration"
                        className="flex flex-1 justify-center text-nowrap w-fit border rounded-xs px-5 py-1.5 text-primary-800 border-primary-800 text-base font-normal bg-transparent hover:border-primary-200 hover:text-mist-800 hover:bg-primary-200 transition-colors duration-300"
                    >
                        Start registration
                    </Link>
                </div>
            </div>
            <div className="flex-1">
                <Image
                    src={"/images/image1.png"}
                    alt="Get money before you work!"
                    title="Get money before you work!"
                    width={1000}
                    height={667}
                    className="aspect-1000/667 w-full object-cover object-center rounded-[10px]"
                />
            </div>
        </SectionWrapper>
    );
}