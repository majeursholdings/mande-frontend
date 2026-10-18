import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { MANUFACTURER_PLAN_SETTINGS_URL, MANUFACTURER_PROFILE_URL, MANUFACTURER_SUPPORT_URL } from "@/constant/manufacturer";
import { SELLING_BLOCKER_MESSAGES, type SellingBlocker } from "@/constant/shop";
import type { SellerOverview } from "@/lib/services/shopService";

const LINK_CLASS = "font-medium text-secondary-700 hover:underline";

/** What fixes each blocker: a page to go to, or the Payouts tab. */
function Fix({ blocker, onConnectPayout }: { blocker: SellingBlocker; onConnectPayout: () => void }) {
    switch (blocker) {
        case "not_verified":
            return (
                <Link href={MANUFACTURER_PROFILE_URL} className={LINK_CLASS}>
                    Verify your NIN
                </Link>
            );
        case "no_active_plan":
            return (
                <Link href={MANUFACTURER_PLAN_SETTINGS_URL} className={LINK_CLASS}>
                    Choose a plan
                </Link>
            );
        case "plan_cannot_sell":
            return (
                <Link href={MANUFACTURER_PLAN_SETTINGS_URL} className={LINK_CLASS}>
                    Upgrade your plan
                </Link>
            );
        case "account_not_active":
        case "access_revoked":
            return (
                <Link href={MANUFACTURER_SUPPORT_URL} className={LINK_CLASS}>
                    Contact support
                </Link>
            );
        case "no_payout_account":
            return (
                <button type="button" onClick={onConnectPayout} className={`${LINK_CLASS} cursor-pointer`}>
                    Connect a bank account
                </button>
            );
        default:
            return null;
    }
}

/**
 * Why the manufacturer can't sell (or list) right now, each with its fix,
 * and how many products their plan allows. Nothing when they can sell and
 * have no limit to show.
 */
export default function StandingBanner({ overview, onConnectPayout }: { overview: SellerOverview; onConnectPayout: () => void }) {
    const { standing, seller } = overview;
    const usage =
        standing.maxProducts !== null ? `${standing.productCount} of ${standing.maxProducts} products on your plan` : null;

    if (standing.blockers.length === 0) {
        return usage ? <p className="text-sm font-text text-mist-500">{usage}. Drafts, listed and paused products count.</p> : null;
    }

    return (
        <div role="status" className="flex gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3.5">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-700" strokeWidth={1.75} aria-hidden />
            <div className="flex flex-col gap-2 text-sm font-text text-warning-900">
                <p className="font-medium">
                    {standing.canCreate ? "You can add products, but not list them yet." : "You can't sell on the shop yet."}
                </p>
                <ul className="flex flex-col gap-1.5">
                    {standing.blockers.map((blocker) => (
                        <li key={blocker} className="flex flex-wrap gap-x-2">
                            <span>
                                {SELLING_BLOCKER_MESSAGES[blocker]}
                                {blocker === "access_revoked" && seller.shopAccess.reason ? ` Reason: ${seller.shopAccess.reason}` : ""}
                            </span>
                            <Fix blocker={blocker} onConnectPayout={onConnectPayout} />
                        </li>
                    ))}
                </ul>
                {usage && <p className="text-xs text-warning-800">{usage}.</p>}
            </div>
        </div>
    );
}
