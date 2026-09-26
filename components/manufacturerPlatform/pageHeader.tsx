import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ManufacturerBackLink } from "@/constant/manufacturer";

/**
 * A dashboard page's title row, with an optional description and a
 * right-aligned action (e.g. a sort dropdown). Sub-pages pass a `backLink`;
 * it shows here on desktop only — on mobile it replaces the top bar instead
 * (see getSubpageBackLink), so keep the two in sync.
 */
export default function PageHeader({
    title,
    description,
    action,
    backLink,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    backLink?: ManufacturerBackLink;
}) {
    return (
        <div className="flex flex-col gap-2">
            {backLink && (
                <Link
                    href={backLink.href}
                    className="hidden lg:inline-flex w-fit items-center gap-2 text-sm font-medium font-text text-secondary-600 hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    {backLink.label}
                </Link>
            )}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">{title}</h1>
                {action}
            </div>
            {description && (
                <p className="max-w-2xl text-sm font-text text-mist-500">{description}</p>
            )}
        </div>
    );
}
