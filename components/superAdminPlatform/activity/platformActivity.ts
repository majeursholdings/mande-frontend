import { formatPrice } from "@/lib/currency";
import {
    ADMIN_POSITION_OPTIONS,
    getAdminTransactions,
    type AdminJob,
    type AdminManufacturer,
    type AdminNotificationPart,
    type AdminPerson,
} from "@/constant/admin";
import { JOB_PRODUCTION_STEPS, MAX_JOB_REJECTIONS, type ProductionStepKey } from "@/constant/jobWorkflow";
import {
    PROJECT_LEADS,
    SAMPLE_SUPPORT_FEEDBACK,
    type AccountActivityRecord,
    type SocialLoginProvider,
    type TwoFactorMethod,
} from "@/constant/sampleDb";

// ─────────────────────────────────────────────────────────────────────────────
// Everything that happens on the platform, for the super admin's activity
// log. Worked out from the records themselves (every job's history, every
// payment, every account's sign-in and status changes, every piece of
// feedback), so it follows along as admins and manufacturers act. Once the
// backend is connected, this is an API feed of the same entries.
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityCategory = "jobs" | "payments" | "accounts" | "feedback";

export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string }[] = [
    { value: "jobs", label: "Jobs" },
    { value: "payments", label: "Payments" },
    { value: "accounts", label: "Accounts" },
    { value: "feedback", label: "Feedback" },
];

export const getActivityCategoryLabel = (category: ActivityCategory) =>
    ACTIVITY_CATEGORIES.find((option) => option.value === category)?.label ?? category;

type PersonActor = { kind: "admin" | "manufacturer"; name: string; avatarUrl: string | null };

/** Who did it: a person, or Mande itself (automatic approvals and payments). */
export type ActivityActor = PersonActor | { kind: "system" };

export const ACTIVITY_ACTOR_LABELS: Record<ActivityActor["kind"], string> = {
    admin: "Admin",
    manufacturer: "Manufacturer",
    system: "Automatic",
};

export type PlatformActivity = {
    id: string;
    /** ISO date. */
    at: string;
    category: ActivityCategory;
    actor: ActivityActor;
    /** Starts with who did it. `{ strong }` parts are the people, jobs and accounts it's about. */
    message: AdminNotificationPart[];
    /** A line under it: a reason, a device, what was written. */
    detail: string | null;
};

const SYSTEM: ActivityActor = { kind: "system" };

const PROVIDER_NAMES: Record<SocialLoginProvider, string> = { google: "Google", facebook: "Facebook" };
const METHOD_NAMES: Record<TwoFactorMethod, string> = { email: "email codes", app: "an authenticator app" };

const stepLabel = (step: ProductionStepKey) =>
    JOB_PRODUCTION_STEPS.find((productionStep) => productionStep.key === step)?.label ?? "production";

/** "Demi Semande" or "Demi Semande and Kesi Nwosu", each in bold. */
function names(people: string[]): AdminNotificationPart[] {
    return people.flatMap((person, index) => (index === 0 ? [{ strong: person }] : [" and ", { strong: person }]));
}

/** What a manufacturer did to how they sign in, keep the account safe or get paid. */
function describeAccountActivity(event: AccountActivityRecord, companyName: string): AdminNotificationPart[] {
    switch (event.type) {
        case "account-created":
            return [" signed up as ", { strong: companyName }];
        case "signed-in-new-device":
            return [" signed in on a new device"];
        case "password-changed":
            return [" changed their password"];
        case "password-reset":
            return [" reset their password from the log-in page"];
        case "phone-changed":
            return [" changed their phone number"];
        case "social-linked":
            return [` linked their ${PROVIDER_NAMES[event.provider]} account`];
        case "social-unlinked":
            return [` unlinked their ${PROVIDER_NAMES[event.provider]} account`];
        case "two-factor-enabled":
            return [` turned on two-factor authentication with ${METHOD_NAMES[event.method]}`];
        case "two-factor-changed":
            return [` switched two-factor authentication to ${METHOD_NAMES[event.method]}`];
        case "two-factor-disabled":
            return [" turned off two-factor authentication"];
        case "bank-added":
            return [` added a bank account (${event.bankName} •••• ${event.accountNumber.slice(-4)})`];
        case "bank-removed":
            return [` removed a bank account (${event.bankName} •••• ${event.accountNumber.slice(-4)})`];
    }
}

/** Every activity on the platform up to `now`, newest first. */
export function getPlatformActivity(
    jobs: AdminJob[],
    manufacturers: AdminManufacturer[],
    leads: AdminPerson[] = PROJECT_LEADS,
    now: Date = new Date(),
): PlatformActivity[] {
    const activities: PlatformActivity[] = [];
    const add = (activity: PlatformActivity) => activities.push(activity);

    const manufacturerActor = (manufacturer: AdminManufacturer): PersonActor => ({
        kind: "manufacturer",
        name: manufacturer.contactName,
        avatarUrl: manufacturer.avatarUrl,
    });
    const manufacturerById = (id: string) => manufacturers.find((manufacturer) => manufacturer.id === id);
    /** Anyone named in a record ("Latade Dipe" signed it off): an admin, or a manufacturer's contact. */
    const personActor = (name: string): PersonActor => {
        const manufacturer = manufacturers.find((record) => record.contactName === name);
        if (manufacturer) return manufacturerActor(manufacturer);
        const lead = leads.find((record) => record.name === name);
        return { kind: "admin", name, avatarUrl: lead?.avatarUrl ?? null };
    };
    /** An activity whose message starts with the actor's name, in bold. */
    const byPerson = (
        activity: Omit<PlatformActivity, "actor" | "message">,
        actor: PersonActor,
        rest: AdminNotificationPart[],
    ) => add({ ...activity, actor, message: [{ strong: actor.name }, ...rest] });

    // ─── Jobs ────────────────────────────────────────────────────────────────
    for (const job of jobs) {
        const title = { strong: job.title };
        const lead = leads.find((record) => record.id === job.projectLeadIds[0]);
        const leadActor = lead ? personActor(lead.name) : null;
        const mainManufacturer = manufacturerById(job.manufacturerIds[0]);
        const jobActivity = (key: string, at: string) => ({ id: `${job.id}-${key}`, at, category: "jobs" as const, detail: null });

        if (leadActor) {
            byPerson(jobActivity("created", job.createdAt), leadActor, [" created the ", title, " job"]);
        }

        for (const assignment of job.assignmentHistory) {
            const offeredTo = assignment.manufacturerIds.flatMap((id) => manufacturerById(id) ?? []);
            if (offeredTo.length === 0) continue;
            byPerson(jobActivity(`${assignment.id}-offered`, assignment.assignedAt), personActor(assignment.assignedBy), [
                " offered the ",
                title,
                " job to ",
                ...names(offeredTo.map((manufacturer) => manufacturer.contactName)),
            ]);
            if ((assignment.outcome === "accepted" || assignment.outcome === "declined") && assignment.outcomeAt) {
                add({
                    ...jobActivity(`${assignment.id}-${assignment.outcome}`, assignment.outcomeAt),
                    actor: manufacturerActor(offeredTo[0]),
                    message: [
                        ...names(offeredTo.map((manufacturer) => manufacturer.contactName)),
                        ` ${assignment.outcome} the `,
                        title,
                        " job",
                    ],
                });
            }
        }

        for (const application of job.applications) {
            const applicant = manufacturerById(application.manufacturerId);
            if (!applicant) continue;
            byPerson(jobActivity(`${application.id}-applied`, application.appliedAt), manufacturerActor(applicant), [
                " applied for the ",
                title,
                " job",
            ]);
            if (application.status !== "pending" && application.decidedAt && leadActor) {
                byPerson(jobActivity(`${application.id}-decided`, application.decidedAt), leadActor, [
                    application.status === "accepted" ? " accepted " : " turned down ",
                    { strong: applicant.contactName },
                    "'s application for ",
                    title,
                ]);
            }
        }

        if (mainManufacturer) {
            const maker = manufacturerActor(mainManufacturer);
            job.stepSubmissions.forEach((submission, index) => {
                const step = stepLabel(submission.step);
                byPerson(
                    { ...jobActivity(`step-${index}-sent`, submission.submittedAt), detail: submission.note ?? null },
                    maker,
                    [` sent proof of the ${step} step on `, title],
                );
                const { review } = submission;
                if (!review) return;
                if (review.by === null) {
                    add({
                        ...jobActivity(`step-${index}-reviewed`, review.at),
                        actor: SYSTEM,
                        message: [`The ${step} step on `, title, " was approved automatically"],
                    });
                    return;
                }
                byPerson(
                    { ...jobActivity(`step-${index}-reviewed`, review.at), detail: review.reason ?? null },
                    personActor(review.by),
                    [review.outcome === "approved" ? ` approved the ${step} step on ` : ` sent back the ${step} step on `, title],
                );
            });

            if (job.submittedForReviewAt) {
                byPerson(jobActivity("submitted", job.submittedForReviewAt), maker, [
                    " sent the finished ",
                    title,
                    " for review",
                ]);
            }

            for (const extension of job.extensionRequests) {
                byPerson(
                    { ...jobActivity(`${extension.id}-requested`, extension.requestedAt), detail: extension.reason },
                    maker,
                    [" asked for more time on ", title],
                );
                if (extension.status !== "pending" && extension.decidedAt && leadActor) {
                    byPerson(jobActivity(`${extension.id}-decided`, extension.decidedAt), leadActor, [
                        extension.status === "approved" ? " gave more time on " : " turned down more time on ",
                        title,
                    ]);
                }
            }
        }

        job.rejections.forEach((rejection, index) => {
            const isLast = index + 1 >= MAX_JOB_REJECTIONS;
            byPerson({ ...jobActivity(rejection.id, rejection.rejectedAt), detail: rejection.reason }, personActor(rejection.rejectedBy), [
                " rejected the finished ",
                title,
                isLast ? " for the last time, closing the job" : "",
            ]);
        });

        if (job.completedAt) {
            if (job.completedBy) {
                byPerson(jobActivity("completed", job.completedAt), personActor(job.completedBy), [" signed off the ", title, " job"]);
            } else {
                add({
                    ...jobActivity("completed", job.completedAt),
                    actor: SYSTEM,
                    message: ["The ", title, " job was signed off automatically"],
                });
            }
        }

        if (job.manufacturerReview) {
            const { rating, comment, authorName, createdAt } = job.manufacturerReview;
            if (mainManufacturer) {
                byPerson({ ...jobActivity("rated", createdAt), detail: comment || null }, personActor(authorName), [
                    " rated ",
                    { strong: mainManufacturer.contactName },
                    ` ${rating} out of 5 for `,
                    title,
                ]);
            }
        }

        if (job.furtherReview) {
            const { rating, comment, authorName, createdAt } = job.furtherReview;
            byPerson({ ...jobActivity("held", createdAt), detail: comment || null }, personActor(authorName), [
                ` rated the finished `,
                title,
                ` ${rating} out of 5, holding it for further review`,
            ]);
        }

        for (const review of job.leadReviews) {
            const reviewer = manufacturerById(review.manufacturerId);
            const lead = leads.find((record) => record.id === review.leadId);
            if (!reviewer || !lead) continue;
            byPerson(
                { ...jobActivity(`lead-review-${review.manufacturerId}`, review.createdAt), detail: review.comment || null },
                manufacturerActor(reviewer),
                [" rated ", { strong: lead.name }, ` ${review.rating} out of 5 as project lead on `, title],
            );
            if (review.followUp) {
                byPerson(
                    { ...jobActivity(`lead-review-${review.manufacturerId}-followed-up`, review.followUp.at), detail: review.followUp.note },
                    personActor(review.followUp.by),
                    [" followed up ", { strong: reviewer.contactName }, "'s rating of ", { strong: lead.name }, " on ", title],
                );
            }
        }

        if (job.faultReport) {
            const { reportedBy, reportedAt, reason } = job.faultReport;
            byPerson({ ...jobActivity("fault", reportedAt), detail: reason }, personActor(reportedBy), [
                " reported a fault in the finished ",
                title,
            ]);
        }

        for (const note of job.notes) {
            byPerson({ ...jobActivity(note.id, note.createdAt), detail: note.message }, personActor(note.authorName), [
                " left a note on ",
                title,
            ]);
        }
    }

    // ─── Payments ────────────────────────────────────────────────────────────
    for (const transaction of getAdminTransactions(manufacturers, jobs)) {
        const manufacturer = manufacturerById(transaction.manufacturerId);
        if (!manufacturer) continue;
        const payment = { id: `payment-${transaction.id}`, at: transaction.date, category: "payments" as const, detail: null };
        const amount = formatPrice(transaction.amount);
        const who = { strong: manufacturer.contactName };
        if (transaction.type === "payment") {
            add({
                ...payment,
                actor: SYSTEM,
                message: [who, ` was paid ${amount} for `, { strong: transaction.projectName ?? "a job" }, ` (${transaction.label})`],
            });
        } else if (transaction.type === "withdrawal") {
            add({ ...payment, actor: manufacturerActor(manufacturer), message: [who, ` withdrew ${amount} to their bank account`] });
        } else if (transaction.type === "charge") {
            add({
                ...payment,
                actor: SYSTEM,
                message: [who, ` was charged ${amount} for the rejected `, { strong: transaction.projectName ?? "job" }],
            });
        } else {
            add({
                ...payment,
                actor: manufacturerActor(manufacturer),
                message: [
                    who,
                    ` paid ${amount} for the ${transaction.label}`,
                    transaction.paidByCard ? " by card" : " from their wallet",
                ],
            });
        }
    }

    // ─── Accounts ────────────────────────────────────────────────────────────
    for (const manufacturer of manufacturers) {
        const actor = manufacturerActor(manufacturer);
        const company = { strong: manufacturer.companyName };
        const account = (key: string, at: string, detail: string | null = null) => ({
            id: `${manufacturer.id}-${key}`,
            at,
            category: "accounts" as const,
            detail,
        });

        for (const event of manufacturer.activity) {
            byPerson(account(event.id, event.at, event.device), actor, describeAccountActivity(event, manufacturer.companyName));
        }

        manufacturer.statusHistory.forEach((event, index) => {
            // "Active" lifts whatever the account was under just before
            const lifted = manufacturer.statusHistory[index + 1]?.status === "suspended" ? "suspension" : "flag";
            byPerson(
                account(`status-${index}`, event.at, event.reason),
                personActor(event.by),
                event.status === "active"
                    ? [` lifted the ${lifted} on `, company]
                    : [event.status === "suspended" ? " suspended " : " flagged ", company],
            );
        });

        for (const appeal of manufacturer.appeals) {
            byPerson(account(`${appeal.id}-sent`, appeal.sentAt, appeal.message), actor, [" appealed the suspension of ", company]);
            if (appeal.status !== "pending" && appeal.decidedAt && appeal.decidedBy) {
                byPerson(account(`${appeal.id}-decided`, appeal.decidedAt, appeal.response), personActor(appeal.decidedBy), [
                    appeal.status === "approved" ? " approved the appeal from " : " turned down the appeal from ",
                    company,
                ]);
            }
        }

        if (manufacturer.deletionRequest) {
            const { requestedBy, requestedAt, reason } = manufacturer.deletionRequest;
            byPerson(account("deletion-request", requestedAt, reason), personActor(requestedBy), [
                " asked for the ",
                company,
                " account to be deleted",
            ]);
        }
    }

    for (const lead of leads) {
        const position = ADMIN_POSITION_OPTIONS.find((option) => option.value === lead.position)?.label ?? null;
        add({
            id: `${lead.id}-joined`,
            at: lead.joinedAt,
            category: "accounts",
            actor: { kind: "admin", name: lead.name, avatarUrl: lead.avatarUrl },
            message: [{ strong: lead.name }, " joined as an admin"],
            detail: position,
        });
    }

    // ─── Feedback ────────────────────────────────────────────────────────────
    for (const feedback of SAMPLE_SUPPORT_FEEDBACK) {
        const manufacturer = manufacturerById(feedback.manufacturerId);
        if (!manufacturer) continue;
        byPerson(
            { id: feedback.id, at: feedback.sentAt, category: "feedback", detail: feedback.message },
            manufacturerActor(manufacturer),
            [
                feedback.category === "problem"
                    ? " reported a problem"
                    : feedback.category === "suggestion"
                      ? " made a suggestion"
                      : " shared feedback",
            ],
        );
    }

    return activities
        .filter((activity) => new Date(activity.at) <= now)
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime() || a.id.localeCompare(b.id));
}
