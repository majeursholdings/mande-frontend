import {
    History,
    KeyRound,
    Landmark,
    Link2,
    MonitorSmartphone,
    Phone,
    RotateCcwKey,
    ShieldCheck,
    ShieldOff,
    Unlink2,
    UserPlus,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDayAndTime } from "@/lib/date";
import type { AccountActivityRecord, SocialLoginProvider, TwoFactorMethod } from "@/constant/platformRecords";
import EmptyState from "../emptyState";

const PROVIDER_NAMES: Record<SocialLoginProvider, string> = { google: "Google", facebook: "Facebook" };

const METHOD_NAMES: Record<TwoFactorMethod, string> = { email: "email", app: "an authenticator app" };

/** "Guaranty Trust Bank •••• 0994" */
const bankLabel = (bankName: string, accountNumber: string) => `${bankName} •••• ${accountNumber.slice(-4)}`;

/**
 * What each kind of activity reads as. "caution" ones are worth a second look
 * when something's gone wrong — a new device, a reset password, two-factor
 * turned off, a bank account removed — and get an amber icon.
 */
function describe(event: AccountActivityRecord): {
    icon: LucideIcon;
    title: string;
    detail: string | null;
    tone: "neutral" | "good" | "caution";
} {
    switch (event.type) {
        case "account-created":
            return { icon: UserPlus, title: "Created the account", detail: null, tone: "neutral" };
        case "signed-in-new-device":
            return { icon: MonitorSmartphone, title: "Signed in on a new device", detail: null, tone: "caution" };
        case "password-changed":
            return { icon: KeyRound, title: "Changed their password", detail: null, tone: "neutral" };
        case "password-reset":
            return {
                icon: RotateCcwKey,
                title: "Reset their password",
                detail: "From “Forgot password” on the log-in page",
                tone: "caution",
            };
        case "phone-changed":
            return { icon: Phone, title: "Changed their phone number", detail: null, tone: "neutral" };
        case "social-linked":
            return {
                icon: Link2,
                title: `Linked their ${PROVIDER_NAMES[event.provider]} account`,
                detail: "To log in with one click",
                tone: "neutral",
            };
        case "social-unlinked":
            return {
                icon: Unlink2,
                title: `Unlinked their ${PROVIDER_NAMES[event.provider]} account`,
                detail: null,
                tone: "neutral",
            };
        case "two-factor-enabled":
            return {
                icon: ShieldCheck,
                title: "Turned on two-factor authentication",
                detail: `Codes from ${METHOD_NAMES[event.method]}`,
                tone: "good",
            };
        case "two-factor-changed":
            return {
                icon: ShieldCheck,
                title: "Changed their two-factor method",
                detail: `Codes from ${METHOD_NAMES[event.method]} now`,
                tone: "good",
            };
        case "two-factor-disabled":
            return {
                icon: ShieldOff,
                title: "Turned off two-factor authentication",
                detail: `Codes were from ${METHOD_NAMES[event.method]}`,
                tone: "caution",
            };
        case "bank-added":
            return {
                icon: Landmark,
                title: "Added a bank account",
                detail: bankLabel(event.bankName, event.accountNumber),
                tone: "neutral",
            };
        case "bank-removed":
            return {
                icon: Landmark,
                title: "Removed a bank account",
                detail: bankLabel(event.bankName, event.accountNumber),
                tone: "caution",
            };
    }
}

const ICON_CLASS = {
    neutral: "bg-mist-100 text-mist-600",
    good: "bg-primary-50 text-primary-700",
    caution: "bg-warning-50 text-warning-700",
} as const;

/**
 * Everything the manufacturer did to how they sign in, keep their account
 * safe and get paid — password changes, linked Google or Facebook accounts,
 * two-factor authentication, bank accounts, new devices — newest first, each
 * with the device it was done from.
 */
export default function ActivityHistory({ activity }: { activity: AccountActivityRecord[] }) {
    if (activity.length === 0) {
        return (
            <EmptyState
                icon={History}
                title="No activity yet"
                description="Password, sign-in and bank account changes will show up here"
            />
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold font-text text-mist-950">
                Activity history <span className="font-normal text-mist-400">({activity.length})</span>
            </h2>
            <ol className="flex flex-col">
                {activity.map((event, index) => {
                    const { icon: Icon, title, detail, tone } = describe(event);
                    const isLast = index === activity.length - 1;
                    return (
                        <li key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                                        ICON_CLASS[tone],
                                    )}
                                >
                                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                                </span>
                                {!isLast && <span className="my-1 w-px flex-1 bg-mist-200" />}
                            </div>
                            <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5", !isLast && "pb-5")}>
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                    <span className="text-sm font-medium font-text text-mist-950">{title}</span>
                                    <span className="text-xs font-text text-mist-400">
                                        {formatDayAndTime(new Date(event.at))}
                                    </span>
                                </div>
                                {detail && <p className="text-sm font-text text-mist-600">{detail}</p>}
                                <p className="text-xs font-text text-mist-400">{event.device}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
