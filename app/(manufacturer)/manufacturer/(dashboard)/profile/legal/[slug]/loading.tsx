import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MANUFACTURER_LEGAL_BACK_LINK } from "@/constant/manufacturer";

/** While a legal document loads: its back link, with skeletons for the title and text. */
export default function ManufacturerLegalDocumentLoading() {
    return (
        <div aria-busy className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <Link
                    href={MANUFACTURER_LEGAL_BACK_LINK.href}
                    className="hidden lg:inline-flex w-fit items-center gap-2 text-sm font-medium font-text text-secondary-600 hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    {MANUFACTURER_LEGAL_BACK_LINK.label}
                </Link>
                <Skeleton className="h-8 w-72 max-w-full" />
                <Skeleton className="h-4 w-40" />
            </div>

            <div className="flex max-w-3xl flex-col gap-3">
                <Skeleton className="h-6 w-56" />
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={i % 3 === 0 ? "h-4 w-2/3" : "h-4 w-full"} />
                ))}
                <Skeleton className="mt-4 h-6 w-48" />
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className={i % 2 === 0 ? "h-4 w-3/4" : "h-4 w-full"} />
                ))}
            </div>
        </div>
    );
}
