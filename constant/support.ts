import type { SelectOption } from "@/components/form/types";

// ─────────────────────────────────────────────────────────────────────────────
// Talk to support — FAQs and feedback categories. Like the legal documents,
// the FAQs would sit well in the CMS (see lib/cms/legal.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type SupportFaq = {
    question: string;
    answer: string;
};

export const SUPPORT_HOURS = "Monday to Saturday, 8am – 6pm (WAT)";

export const SUPPORT_FAQS: SupportFaq[] = [
    {
        question: "How do I get paid for a job?",
        answer: "Payments come in installments as your job moves through production, and land in your Mande balance. You can see every payment on the Transactions page.",
    },
    {
        question: "How long do withdrawals take?",
        answer: "Most withdrawals arrive within a few minutes, but it can vary by bank. Bank charges and our processing partner's fee are added to each withdrawal.",
    },
    {
        question: "Why isn't my account verified yet?",
        answer: "Our team reviews every NIN card before verifying an account. This usually takes 1–2 working days — you'll get a notification once it's done.",
    },
    {
        question: "What happens if my finished work is rejected?",
        answer: "You'll see the reason on the job, and can redo the work and resubmit it with new photos. A job can be rejected up to three times.",
    },
    {
        question: "Can I change or cancel my plan?",
        answer: "Yes — from Settings › Plan. Upgrades start straight away; downgrades and cancellations take effect when your billing period ends.",
    },
    {
        question: "What if I can't meet a job's due date?",
        answer: "Report a delay from the job as early as you can. It's passed to our customer team so the customer is kept in the loop.",
    },
];

export const FEEDBACK_CATEGORY_OPTIONS: SelectOption[] = [
    { label: "General feedback", value: "feedback" },
    { label: "Suggestion", value: "suggestion" },
    { label: "Something isn't working", value: "problem" },
];
