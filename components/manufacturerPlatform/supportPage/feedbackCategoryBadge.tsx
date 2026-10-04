import { StatusBadge, type StatusTone } from "@/components/customTable/statusBadge";
import { getOptionLabel } from "@/constant/manufacturer";
import { FEEDBACK_CATEGORY_OPTIONS } from "@/constant/support";
import type { SupportFeedbackRecord } from "@/constant/platformRecords";

const CATEGORY_TONES: Record<SupportFeedbackRecord["category"], StatusTone> = {
    feedback: "green",
    suggestion: "blue",
    problem: "red",
};

/** What a piece of feedback is about — the same pill for the manufacturer who sent it and the admins who read it. */
export default function FeedbackCategoryBadge({ category }: { category: SupportFeedbackRecord["category"] }) {
    return (
        <StatusBadge
            label={getOptionLabel(FEEDBACK_CATEGORY_OPTIONS, category)}
            tone={CATEGORY_TONES[category]}
            variant="pill"
        />
    );
}
