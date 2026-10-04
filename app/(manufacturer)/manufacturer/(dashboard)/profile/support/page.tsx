import ManufacturerSupportPage from "@/components/manufacturerPlatform/supportPage";
import { getFaqTokens } from "@/constant/website";
import { fillFaqTokens, getFaqGroups } from "@/lib/cms/faq";

export default async function ManufacturerSupportRoute() {
    const groups = await getFaqGroups("support").catch(() => null);
    // The platform's rules fill in the answers' placeholders (the plans' ones aren't offered here)
    const filled = groups && fillFaqTokens(groups, getFaqTokens(0, []));
    return <ManufacturerSupportPage faqs={filled ? filled.flatMap((group) => group.faqs) : null} />;
}
