import Image from "next/image";
import Link from "next/link";
import { clientList } from "@/constant/global";
import { ARTISAN_SIGNUP_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

/**
 * The homepage's opening band — the website pages' grey hero, a size up:
 * the promise, the two ways in, and the brands makers build for.
 */
export default function HomeHeroSection() {
    return (
        <section className="bg-mist-200 px-2.5 py-12.5 md:pt-24 md:pb-20">
            <div className="container mx-auto flex flex-col items-center gap-14 text-center md:gap-20">
                <div className="flex flex-col items-center gap-5 text-pretty">
                    <span className="text-lg font-medium">Start making money from MANDE today</span>
                    <h1 className="max-w-225 text-4xl tracking-tight md:text-6xl">
                        Grow your furniture business from local customers to an international audience.
                    </h1>
                    <p className="max-w-160 text-base font-light md:text-lg">
                        Find real furniture jobs, get paid as each stage is approved, and build on the country&apos;s top
                        machines at our Lagos factory.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                        <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_PRIMARY_BUTTON}>
                            Create your profile
                        </Link>
                        <Link href={OPEN_JOBS_URL} className={WEBSITE_OUTLINE_BUTTON}>
                            Browse open jobs
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-5">
                    <span className="text-base font-light">Makers on MANDE build furniture for leading brands</span>
                    <ul className="grid grid-cols-3 items-center gap-8 md:grid-cols-6 md:gap-10">
                        {clientList.map((client) => (
                            <li key={client.id}>
                                <Image
                                    src={client.src}
                                    alt={client.alt}
                                    title={client.title}
                                    width={client.width}
                                    height={client.height}
                                    className="max-w-20 object-cover object-center"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
