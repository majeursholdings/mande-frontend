import ManufacturerSupportPage from "@/components/manufacturerPlatform/supportPage";
import { getFaqTokens } from "@/constant/website";
import { fillFaqTokens, getFaqGroups, type FaqGroup } from "@/lib/cms/faq";
import { getPublicJobRules } from "@/lib/services/settingsService";
import { getWebsitePlans, toPricingPlan } from "@/lib/services/websiteService";

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

/** The FAQs whose every {{placeholder}} has a value: one that can't be filled is left out, not the rest. */
function answerableFaqs(groups: FaqGroup[], tokens: Record<string, string>): FaqGroup[] {
    return groups.map((group) => ({
        ...group,
        faqs: group.faqs.filter((faq) =>
            [...faq.answer.matchAll(PLACEHOLDER)].every(([, name]) => name in tokens),
        ),
    }));
}

export default async function ManufacturerSupportRoute() {
    const [groups, jobRules, plansData] = await Promise.all([
        getFaqGroups("support").catch(() => null),
        getPublicJobRules(),
        getWebsitePlans(),
    ]);
    // The platform's current rules and plans fill in the answers' placeholders
    const tokens = getFaqTokens(
        plansData?.discountPercent ?? 0,
        (plansData?.plans ?? []).map(toPricingPlan),
        jobRules,
    );
    const filled = groups && fillFaqTokens(answerableFaqs(groups, tokens), tokens);
    return <ManufacturerSupportPage faqs={filled ? filled.flatMap((group) => group.faqs) : null} />;
}
