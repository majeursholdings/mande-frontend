import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo, { BlackLogo } from "@/components/mainWebsite/navigations/logo";

/**
 * The MANDE logo as a link home — in the dashboards, the platform's
 * dashboard; on the sign-in screens, the Mande website. Size it with
 * `className`, e.g. "w-25".
 */
export default function LogoLink({
    href,
    label = "MANDE — go to your dashboard",
    tone = "dark",
    onClick,
    className,
}: {
    href: string;
    /** What the link is called to screen readers — where it goes. */
    label?: string;
    /** "light" for the white logo, on a photo or a dark background. */
    tone?: "dark" | "light";
    /** e.g. to close the drawer it's in. */
    onClick?: () => void;
    className?: string;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            aria-label={label}
            className={cn(
                "block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                tone === "dark" ? "focus-visible:ring-secondary-300" : "focus-visible:ring-white/80 focus-visible:ring-offset-transparent",
                className,
            )}
        >
            {tone === "dark" ? <BlackLogo /> : <Logo />}
        </Link>
    );
}
