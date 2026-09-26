import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";

/**
 * Title row for the profile's sub-pages (edit, transactions, reviews). The
 * "Back to Profile" link only shows here on desktop — on mobile it replaces
 * the top bar instead (see MANUFACTURER_SUBPAGE_BACK_LINKS).
 */
export default function ProfileSubpageHeader({
    title,
    action,
}: {
    title: string;
    /** Right-aligned beside the title, e.g. a sort dropdown. */
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Link
                href={MANUFACTURER_PROFILE_BACK_LINK.href}
                className="hidden lg:inline-flex w-fit items-center gap-2 text-sm font-medium font-text text-secondary-600 hover:underline"
            >
                <ArrowLeft className="size-4" />
                {MANUFACTURER_PROFILE_BACK_LINK.label}
            </Link>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">{title}</h1>
                {action}
            </div>
        </div>
    );
}
