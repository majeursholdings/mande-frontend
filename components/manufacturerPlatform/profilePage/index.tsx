"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import {
    MANUFACTURER_REVIEWS,
    PRODUCTION_LEAD_TIME_OPTIONS,
    STAFF_RANGE_OPTIONS,
    getOptionLabel,
} from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import ProfileCard from "./profileCard";
import BalanceCard from "./balanceCard";
import ProfileStatCard from "./profileStatCard";
import TransactionsPreview from "./transactionsPreview";
import ReviewsPreview from "./reviewsPreview";
import WalletActions from "./walletActions";

/** "21 to 30" → "21 - 30" — the stat cards show ranges with a dash. */
function formatRange(label: string): string {
    return label.replace(" to ", " - ");
}

export default function ManufacturerProfilePage() {
    const { profile } = useManufacturerProfile();
    const { wallet } = useManufacturerWallet();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Profile</h1>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <ProfileCard profile={profile} className="lg:w-65 lg:shrink-0" />

                <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-6">
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-3">
                        <BalanceCard
                            balance={wallet.balance}
                            className="col-span-2 xl:col-span-1"
                        />
                        <ProfileStatCard
                            label="Number of Staff"
                            value={formatRange(getOptionLabel(STAFF_RANGE_OPTIONS, profile.staffRange))}
                        />
                        <ProfileStatCard
                            label="Avg. Production Time"
                            value={formatRange(
                                getOptionLabel(PRODUCTION_LEAD_TIME_OPTIONS, profile.productionLeadTime),
                            )}
                        />
                    </div>

                    <WalletActions />

                    <div className="grid gap-8 lg:gap-6 xl:grid-cols-[4fr_5fr]">
                        <TransactionsPreview transactions={wallet.transactions} />
                        <ReviewsPreview reviews={MANUFACTURER_REVIEWS} />
                    </div>
                </div>
            </div>

            {/* Mobile only — the desktop sidebar has its own Logout, the bottom nav doesn't */}
            <Link
                href={ARTISAN_LOGIN_URL}
                className="lg:hidden mx-auto flex items-center gap-2 py-2 text-base font-medium font-text text-secondary-600"
            >
                <LogOut className="size-5" strokeWidth={1.75} />
                Logout
            </Link>
        </div>
    );
}
