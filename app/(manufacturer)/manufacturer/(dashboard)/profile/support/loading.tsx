import { Skeleton } from "@/components/ui/skeleton";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import PageHeader from "@/components/manufacturerPlatform/pageHeader";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";

/** While the FAQs and rules load: the page's own titles, with skeletons for what comes from the server. */
export default function ManufacturerSupportLoading() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Talk to support"
                description="Find quick answers, or tell us how we can do better."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            <div aria-busy className="flex max-w-3xl flex-col gap-8">
                <SettingsSection title="Frequently asked questions">
                    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-white px-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="py-4">
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                        ))}
                    </div>
                </SettingsSection>

                <SettingsSection
                    title="Share feedback"
                    description="Tell us what's working, what isn't, or what you'd like to see. We read every message."
                >
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-36 w-full" />
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
}
