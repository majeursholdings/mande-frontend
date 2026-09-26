import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** A titled profile section — a bordered card on desktop, flat on mobile. */
export default function ProfileSectionCard({
    title,
    viewAllHref,
    children,
}: {
    title: string;
    /** Shows a "View all" link. Leave out when there's nothing more to see. */
    viewAllHref?: string;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-5 lg:rounded-xl lg:border lg:border-border lg:bg-white lg:p-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold font-text text-mist-950">{title}</h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex items-center gap-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
                    >
                        View all
                        <ChevronRight className="size-4" />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}
