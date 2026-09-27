import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * An admin page's title, with an optional description and a link back to
 * the page above it — shown at every size, as the admin's phone top bar has
 * no back button.
 */
export default function AdminPageHeader({
    title,
    description,
    backLink,
}: {
    title: string;
    description?: ReactNode;
    backLink?: { href: string; label: string };
}) {
    return (
        <div className="flex flex-col gap-2">
            {backLink && (
                <Link
                    href={backLink.href}
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-medium font-text text-secondary-700 hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    {backLink.label}
                </Link>
            )}
            <h1 className="text-2xl font-semibold font-text text-mist-950">{title}</h1>
            {description && <p className="max-w-2xl text-sm font-text text-mist-500">{description}</p>}
        </div>
    );
}
