import { Skeleton } from "@/components/ui/skeleton";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import PageHeader from "@/components/manufacturerPlatform/pageHeader";

/** While the legal documents load: the page's own title, with skeleton rows for the documents. */
export default function ManufacturerLegalLoading() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Legal information"
                description="The policies that apply when you use Mande."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            <ul aria-busy className="flex max-w-2xl flex-col gap-3">
                {[1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
                        <Skeleton className="size-10 shrink-0 rounded-full" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-full max-w-sm" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
