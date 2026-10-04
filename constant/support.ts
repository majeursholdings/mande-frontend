import type { SelectOption } from "@/components/form/types";

// ─────────────────────────────────────────────────────────────────────────────
// Talk to support — the team's hours and feedback categories. The page's
// FAQs are in the CMS (lib/cms/faq.ts).
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORT_HOURS = "Monday to Saturday, 8am – 6pm (WAT)";

export const FEEDBACK_CATEGORY_OPTIONS: SelectOption[] = [
    { label: "General feedback", value: "feedback" },
    { label: "Suggestion", value: "suggestion" },
    { label: "Something isn't working", value: "problem" },
];
