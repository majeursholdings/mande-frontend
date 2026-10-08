"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
    BadgeCheck,
    CreditCard,
    History,
    KeyRound,
    Landmark,
    LogIn,
    RotateCcwKey,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    UserPen,
    UserPlus,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDayAndTime } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService, type ManufacturerActivityEntry } from "@/lib/services/manufacturerService";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState, { LoadError } from "../emptyState";

/**
 * How each kind of activity looks, by its action ("auth.password_reset").
 * "caution" ones are worth a second look when something's gone wrong (a reset
 * password, two-factor turned off, a bank account removed, a reused sign-in
 * token) and get an amber icon. Anything else gets a plain history icon; the
 * entry's own summary always says what happened.
 */
const LOOKS: { match: RegExp; icon: LucideIcon; tone: Tone }[] = [
    { match: /^auth\.(registered)$/, icon: UserPlus, tone: "neutral" },
    { match: /^auth\.email_verified$/, icon: BadgeCheck, tone: "good" },
    { match: /^auth\.login(_stepped_up)?$/, icon: LogIn, tone: "neutral" },
    { match: /^auth\.password_changed$/, icon: KeyRound, tone: "neutral" },
    { match: /^auth\.password_reset$/, icon: RotateCcwKey, tone: "caution" },
    { match: /^auth\.refresh_reuse_detected$/, icon: ShieldAlert, tone: "caution" },
    { match: /^auth\.two_factor_enabled$/, icon: ShieldCheck, tone: "good" },
    { match: /^auth\.two_factor_disabled$/, icon: ShieldOff, tone: "caution" },
    { match: /^wallet\.bank_account_set$/, icon: Landmark, tone: "neutral" },
    { match: /^wallet\.bank_account_removed$/, icon: Landmark, tone: "caution" },
    { match: /^wallet\./, icon: Wallet, tone: "neutral" },
    { match: /^subscription\./, icon: CreditCard, tone: "neutral" },
    { match: /^profile\./, icon: UserPen, tone: "neutral" },
];

type Tone = "neutral" | "good" | "caution";

const ICON_CLASS: Record<Tone, string> = {
    neutral: "bg-mist-100 text-mist-600",
    good: "bg-primary-50 text-primary-700",
    caution: "bg-warning-50 text-warning-700",
};

const lookOf = (action: string) => LOOKS.find((look) => look.match.test(action)) ?? { icon: History, tone: "neutral" as const };

const PAGE_SIZE = 20;

/**
 * What happened to how the manufacturer signs in, keeps their account safe
 * and gets paid (sign-ins, passwords, two-factor, bank accounts, plans),
 * from the activity log: newest first, each with who did it and the device,
 * a page at a time.
 */
export default function ActivityHistory({ manufacturerId }: { manufacturerId: string }) {
    const query = useInfiniteQuery({
        queryKey: [...queryKeys.manufacturers.detail(manufacturerId), "activity"],
        queryFn: ({ pageParam }) =>
            manufacturerService.getManufacturerActivity(manufacturerId, { limit: PAGE_SIZE, before: pageParam ?? undefined }),
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
    });

    if (query.isPending) {
        return (
            <div className="flex flex-col gap-5" aria-busy="true">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex gap-3">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <div className="flex flex-1 flex-col gap-1.5 pt-1">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    if (query.isError) return <LoadError message="We couldn't load their activity. Please refresh the page." />;

    const activity: ManufacturerActivityEntry[] = query.data.pages.flatMap((page) => page.activity);
    if (activity.length === 0) {
        return (
            <EmptyState
                icon={History}
                title="No activity yet"
                description="Sign-ins, password, two-factor and bank account changes will show up here"
            />
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold font-text text-mist-950">Activity history</h2>
            <ol className="flex flex-col">
                {activity.map((event, index) => {
                    const { icon: Icon, tone } = lookOf(event.action);
                    const isLast = index === activity.length - 1;
                    return (
                        <li key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", ICON_CLASS[tone])}>
                                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                                </span>
                                {!isLast && <span className="my-1 w-px flex-1 bg-mist-200" />}
                            </div>
                            <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5", !isLast && "pb-5")}>
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                    <span className="text-sm font-medium font-text text-mist-950">{event.summary}</span>
                                    <span className="text-xs font-text text-mist-400">{formatDayAndTime(new Date(event.at))}</span>
                                </div>
                                <p className="text-xs font-text text-mist-400">
                                    {/* Staff changes to the account show who made them */}
                                    {event.byThem ? "By them" : `By ${event.actorName}`}
                                    {event.device ? ` · ${event.device}` : ""}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {query.hasNextPage && (
                <button
                    type="button"
                    onClick={() => void query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                    className="self-start text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60"
                >
                    {query.isFetchingNextPage ? "Loading..." : "Show older activity"}
                </button>
            )}
        </section>
    );
}
