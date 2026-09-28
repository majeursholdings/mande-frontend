import Image from "next/image";
import LogoLink from "@/components/ui/logoLink";
import { MANDE_WEBSITE_URL } from "@/constant/navigation";
import { AUTH_HEADLINE, AUTH_HERO_IMAGE } from "@/constant/global";

/** The photo half of the admin auth screens — headline on top, logo at the bottom. Hidden on phones. */
export default function AuthSidePanel() {
    return (
        <div className="relative isolate hidden md:flex md:w-1/2 flex-col justify-between overflow-hidden p-10 lg:p-20 text-white">
            <Image
                src={AUTH_HERO_IMAGE}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 50vw, 0vw"
                className="object-cover -z-20"
            />
            <div
                className="absolute inset-0 -z-10 bg-linear-to-b from-primary-300/75 via-primary-900/25 to-secondary-500/70"
                aria-hidden
            />

            <p className="text-4xl lg:text-5xl font-bold font-text leading-tight tracking-tight max-w-lg text-pretty">
                {AUTH_HEADLINE}
            </p>

            <LogoLink href={MANDE_WEBSITE_URL} label="MANDE, go to the Mande website" tone="light" className="max-w-45" />
        </div>
    );
}
