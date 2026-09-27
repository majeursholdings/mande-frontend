"use client";

import { Flag } from "lucide-react";
import { useManufacturerAccount } from "./manufacturerAccountContext";

/**
 * Across the top of every page while an admin has flagged the account — why,
 * and what it means. A suspended account sees SuspendedAccountScreen instead.
 */
export default function AccountStatusBanner() {
    const { isFlagged, hold } = useManufacturerAccount();
    if (!isFlagged) return null;

    return (
        <section role="status" className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Flag className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div className="flex flex-col gap-1 text-sm font-text">
                <h2 className="font-semibold text-amber-800">Your account is flagged</h2>
                {hold?.reason && <p className="text-mist-800">{hold.reason}</p>}
                <p className="text-mist-600">You can hold one job at a time until the flag is lifted.</p>
            </div>
        </section>
    );
}
