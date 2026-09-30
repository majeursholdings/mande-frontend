// ─────────────────────────────────────────────────────────────────────────────
// How a job moves and pays — shared by the manufacturer and admin platforms.
//
// The manufacturer works through the production steps in order, sending up
// to MAX_STEP_PROOF_PHOTOS photos as proof of each one — they can go on to
// the next step while the last one waits for review. The project lead
// approves the proof or sends it back with a reason (the manufacturer sends
// new proof before going further). Once every step is approved they
// submit the finished furniture, and the lead signs the job off or rejects
// it. Anything waiting for the lead is approved automatically
// REVIEW_WINDOW_HOURS after it was sent, not counting Sundays.
//
// The job's amount — the manufacturer's labour — is paid in six parts as
// the job moves (see JOB_PAYMENT_SCHEDULE), each released to their wallet
// the moment it's earned, plus a JOB_BONUS_PERCENT bonus for work delivered
// on time with nothing sent back and no fault reported in the
// FAULT_REPORT_DAYS after sign-off. Each time the finished work is rejected,
// REJECTION_CHARGE_PERCENT of the amount is charged from their wallet.
// ─────────────────────────────────────────────────────────────────────────────

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// ─── Production steps ────────────────────────────────────────────────────────

export type ProductionStepKey = "design" | "materials" | "frame" | "assembly" | "finishing" | "delivery";

export const JOB_PRODUCTION_STEPS: { key: ProductionStepKey; label: string }[] = [
    { key: "design", label: "Design" },
    { key: "materials", label: "Materials" },
    { key: "frame", label: "Frame" },
    { key: "assembly", label: "Assembly" },
    { key: "finishing", label: "Finishing" },
    { key: "delivery", label: "Delivery" },
];

export const MIN_STEP_PROOF_PHOTOS = 3;
export const MAX_STEP_PROOF_PHOTOS = 6;

export type StepReview = {
    outcome: "approved" | "sent-back";
    /** ISO date. */
    at: string;
    /** Who reviewed it. Null when it was approved automatically. */
    by: string | null;
    /** Why it was sent back. */
    reason?: string;
};

/** One time the manufacturer sent proof of a step for review. */
export type StepSubmission = {
    step: ProductionStepKey;
    /** Up to MAX_STEP_PROOF_PHOTOS. */
    imageUrls: string[];
    /** What the manufacturer wrote with it, if anything — every step's proof can take a note. */
    note?: string;
    /** ISO date. */
    submittedAt: string;
    /** Null while it's waiting for the lead. */
    review: StepReview | null;
};

/**
 * Where a step stands: approved; its proof waiting for review, or sent back;
 * the one the manufacturer is on (no proof yet); or still to come.
 */
export type StepState = "approved" | "in-review" | "sent-back" | "current" | "upcoming";

export type StepProgress = {
    key: ProductionStepKey;
    label: string;
    state: StepState;
    /** Every proof sent for this step, oldest first. */
    submissions: StepSubmission[];
};

/**
 * Every production step and where it stands. A step opens once every step
 * before it has proof in — approved or still waiting for review; proof sent
 * back holds up the steps after it until new proof is sent.
 */
export function getStepProgress(submissions: StepSubmission[]): StepProgress[] {
    let isOpen = true;
    return JOB_PRODUCTION_STEPS.map(({ key, label }) => {
        const stepSubmissions = submissions.filter((submission) => submission.step === key);
        const latest = stepSubmissions.at(-1);
        const state: StepState = latest
            ? !latest.review
                ? "in-review"
                : latest.review.outcome === "sent-back"
                  ? "sent-back"
                  : "approved"
            : isOpen
              ? "current"
              : "upcoming";
        if (state === "current" || state === "sent-back") isOpen = false;
        return { key, label, state, submissions: stepSubmissions };
    });
}

/**
 * The step the manufacturer is working on — the first one waiting for proof
 * (or new proof, after being sent back), else the latest one in review.
 * Null once every step is approved.
 */
export function getCurrentStep(submissions: StepSubmission[]): ProductionStepKey | null {
    const steps = getStepProgress(submissions);
    return (
        steps.find((step) => step.state === "current" || step.state === "sent-back")?.key ??
        steps.filter((step) => step.state === "in-review").at(-1)?.key ??
        null
    );
}

/**
 * Whether the manufacturer can still cancel — only until they're past the
 * Materials step (its proof sent, and not sent back), when the materials
 * money has been spent on the job.
 */
export function canCancelJob(submissions: StepSubmission[]): boolean {
    const materials = getStepProgress(submissions).find((step) => step.key === "materials");
    return materials?.state !== "approved" && materials?.state !== "in-review";
}

/** The steps approved so far, in order. */
export function getApprovedStepKeys(submissions: StepSubmission[]): ProductionStepKey[] {
    return getStepProgress(submissions)
        .filter((step) => step.state === "approved")
        .map((step) => step.key);
}

/** When a step's latest proof was approved. Null if it hasn't been. */
export function getStepApprovedAt(submissions: StepSubmission[], step: ProductionStepKey): string | null {
    const latest = submissions.filter((submission) => submission.step === step).at(-1);
    return latest?.review?.outcome === "approved" ? latest.review.at : null;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

/** Finished work can be rejected this many times — after the last, it can't be resubmitted. */
export const MAX_JOB_REJECTIONS = 3;

/**
 * Signing off finished work means rating the manufacturer, out of 5. Work
 * rated below this (3 stars or less) isn't signed off: it's held for a super
 * admin to review further, who signs it off or sends it back.
 */
export const MIN_SIGN_OFF_RATING = 4;

export const REVIEW_WINDOW_HOURS = 24;

/**
 * When something sent for review is approved automatically if no one has
 * reviewed it — REVIEW_WINDOW_HOURS later, with Sundays not counted (sent
 * Saturday at 3pm, it's approved on Monday at 3pm).
 */
export function getAutoApproveAt(submittedAt: string | Date): Date {
    let at = new Date(submittedAt);
    let remaining = REVIEW_WINDOW_HOURS * HOUR_MS;
    while (remaining > 0 || at.getDay() === 0) {
        const nextMidnight = new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1);
        if (at.getDay() === 0) {
            at = nextMidnight;
            continue;
        }
        const counted = Math.min(remaining, nextMidnight.getTime() - at.getTime());
        at = new Date(at.getTime() + counted);
        remaining -= counted;
    }
    return at;
}

/** The submissions with every auto-approval that has come due by `now` applied. */
export function settleStepSubmissions(submissions: StepSubmission[], now: Date = new Date()): StepSubmission[] {
    return submissions.map((submission) => {
        if (submission.review) return submission;
        const approveAt = getAutoApproveAt(submission.submittedAt);
        return approveAt <= now
            ? { ...submission, review: { outcome: "approved", at: approveAt.toISOString(), by: null } }
            : submission;
    });
}

// ─── Delays ──────────────────────────────────────────────────────────────────

/**
 * A delay can push the due date back by at most this share of the job's
 * original length — start to the due date it first had — in all.
 */
export const MAX_EXTENSION_PERCENT = 20;

/**
 * The due date before any extension — what the oldest approved one moved it
 * from. `extensionRequests` are newest first.
 */
export function getOriginalDueDate(
    dueDate: string,
    extensionRequests: { status: string; previousDueDate: string }[],
): string {
    return extensionRequests.filter((request) => request.status === "approved").at(-1)?.previousDueDate ?? dueDate;
}

/**
 * The latest due date a delay can ask for — MAX_EXTENSION_PERCENT of the
 * job's original length past its original due date.
 */
export function getLatestAllowedDueDate(start: string, originalDueDate: string): Date {
    const startMs = new Date(start).getTime();
    const dueMs = new Date(originalDueDate).getTime();
    return new Date(dueMs + (Math.max(0, dueMs - startMs) * MAX_EXTENSION_PERCENT) / 100);
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type JobPaymentMilestone = "accepted" | "frame" | "assembly" | "finishing" | "delivery" | "signed-off";

/**
 * The six parts of a job's pay, as shares of its amount — Design and
 * Materials pay nothing, as materials are funded separately.
 */
export const JOB_PAYMENT_SCHEDULE: { milestone: JobPaymentMilestone; label: string; percent: number }[] = [
    { milestone: "accepted", label: "Job accepted", percent: 10 },
    { milestone: "frame", label: "Frame approved", percent: 12 },
    { milestone: "assembly", label: "Assembly approved", percent: 14 },
    { milestone: "finishing", label: "Finishing approved", percent: 18 },
    { milestone: "delivery", label: "Delivery approved", percent: 18 },
    { milestone: "signed-off", label: "Signed off", percent: 28 },
];

export const JOB_BONUS_PERCENT = 5;

/**
 * Charged from the manufacturer's wallet each time their finished work is
 * rejected, as a percent of their part of the job's amount. It's Mande's
 * revenue (see the super admin's Revenue page).
 */
export const REJECTION_CHARGE_PERCENT = 5;

/** What one rejection charges, for `amount` of the job's pay. */
export const getRejectionCharge = (amount: number) => Math.round((amount * REJECTION_CHARGE_PERCENT) / 100);
/** How long after sign-off a fault can be reported — the bonus is released after it. */
export const FAULT_REPORT_DAYS = 7;

/** A lead reporting a fault in delivered work, which cancels the bonus. */
export type JobFaultReport = {
    reason: string;
    /** ISO date. */
    reportedAt: string;
    reportedBy: string;
};

/** What the payments are worked out from — both platforms' jobs provide it. */
export type JobPaymentInput = {
    /** The manufacturer's labour — what they're paid for the job, in naira. */
    amount: number;
    /** ISO date. */
    dueDate: string;
    /** ISO date the manufacturer accepted. Null while pending. */
    acceptedAt: string | null;
    stepSubmissions: StepSubmission[];
    /** ISO date the job was signed off. Null until it is. */
    signedOffAt: string | null;
    rejectionCount: number;
    faultReport: JobFaultReport | null;
};

export type JobPayment = {
    milestone: JobPaymentMilestone;
    label: string;
    percent: number;
    amount: number;
    /** ISO date it was released to the manufacturer's wallet. Null while it's still to come. */
    releasedAt: string | null;
};

export type JobBonus = {
    percent: number;
    amount: number;
    /**
     * "on-track" until sign-off; "due" for the FAULT_REPORT_DAYS after it;
     * then "released" — or "lost" if the job ran late, a stage was sent
     * back or the work rejected, or a fault was reported.
     */
    status: "on-track" | "due" | "released" | "lost";
    lostReason: "late" | "sent-back" | "fault" | null;
    /** ISO date it's released — FAULT_REPORT_DAYS after sign-off. Null before sign-off, or once lost. */
    releaseAt: string | null;
};

/** Shares of `amount` in whole naira — the last takes the rounding remainder, so they add up. */
function splitAmount(amount: number, percents: number[]): number[] {
    const parts = percents.map((percent) => Math.round((amount * percent) / 100));
    parts[parts.length - 1] = amount - parts.slice(0, -1).reduce((sum, part) => sum + part, 0);
    return parts;
}

function getReleasedAt(job: JobPaymentInput, milestone: JobPaymentMilestone): string | null {
    if (milestone === "accepted") return job.acceptedAt;
    if (milestone === "signed-off") return job.signedOffAt;
    return getStepApprovedAt(job.stepSubmissions, milestone);
}

/** The job's six payments and its bonus, as they stand at `now`. */
export function getJobPayments(
    job: JobPaymentInput,
    now: Date = new Date(),
): { payments: JobPayment[]; bonus: JobBonus } {
    const amounts = splitAmount(
        job.amount,
        JOB_PAYMENT_SCHEDULE.map((payment) => payment.percent),
    );
    const payments = JOB_PAYMENT_SCHEDULE.map((payment, index) => ({
        ...payment,
        amount: amounts[index],
        releasedAt: getReleasedAt(job, payment.milestone),
    }));

    const deliveredAt = job.stepSubmissions.filter((submission) => submission.step === "delivery").at(-1)?.submittedAt;
    const dueAt = new Date(job.dueDate);
    const lostReason: JobBonus["lostReason"] = job.faultReport
        ? "fault"
        : job.rejectionCount > 0 || job.stepSubmissions.some((submission) => submission.review?.outcome === "sent-back")
          ? "sent-back"
          : (deliveredAt ? new Date(deliveredAt) : now) > dueAt
            ? "late"
            : null;
    const releaseAt =
        !lostReason && job.signedOffAt
            ? new Date(new Date(job.signedOffAt).getTime() + FAULT_REPORT_DAYS * DAY_MS).toISOString()
            : null;

    return {
        payments,
        bonus: {
            percent: JOB_BONUS_PERCENT,
            amount: Math.round((job.amount * JOB_BONUS_PERCENT) / 100),
            status: lostReason
                ? "lost"
                : !releaseAt
                  ? "on-track"
                  : new Date(releaseAt) <= now
                    ? "released"
                    : "due",
            lostReason,
            releaseAt,
        },
    };
}

/** Whether a fault can still be reported — within FAULT_REPORT_DAYS of sign-off, once. */
export function canReportFault(
    job: Pick<JobPaymentInput, "signedOffAt" | "faultReport">,
    now: Date = new Date(),
): boolean {
    return (
        !!job.signedOffAt &&
        !job.faultReport &&
        now.getTime() - new Date(job.signedOffAt).getTime() < FAULT_REPORT_DAYS * DAY_MS
    );
}

// ─── Sample data ─────────────────────────────────────────────────────────────

/**
 * Sample proof for the first `approved` steps — sent one after another
 * between `from` and `to`, each approved by `reviewer` two hours after it
 * was sent — then proof of the steps after them still waiting for review,
 * one per `waitingSince` date.
 */
export function sampleStepSubmissions({
    approved,
    from,
    to,
    reviewer,
    imageUrl,
    waitingSince = [],
}: {
    approved: number;
    from: Date;
    to: Date;
    reviewer: string;
    imageUrl: string;
    waitingSince?: Date[];
}): StepSubmission[] {
    const gap = (to.getTime() - from.getTime()) / (approved + 1);
    const submissions: StepSubmission[] = JOB_PRODUCTION_STEPS.slice(0, approved).map(({ key }, index) => {
        const submittedAt = new Date(from.getTime() + gap * (index + 1));
        return {
            step: key,
            imageUrls: [imageUrl],
            submittedAt: submittedAt.toISOString(),
            review: {
                outcome: "approved",
                at: new Date(submittedAt.getTime() + 2 * HOUR_MS).toISOString(),
                by: reviewer,
            },
        };
    });
    waitingSince.forEach((submittedAt, index) => {
        const step = JOB_PRODUCTION_STEPS[approved + index];
        if (step) submissions.push({ step: step.key, imageUrls: [imageUrl], submittedAt: submittedAt.toISOString(), review: null });
    });
    return submissions;
}
