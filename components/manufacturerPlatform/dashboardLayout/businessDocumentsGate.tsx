"use client";

import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import BusinessDocumentsForm from "@/components/manufacturerPlatform/form/businessDocumentsForm";
import { hasBusinessDocuments } from "@/constant/manufacturer";
import { getPricingPlan, requiresBusinessDocuments } from "@/constant/sampleData";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";
import { useManufacturerProfile } from "./manufacturerProfileContext";
import { useManufacturerSubscription } from "./manufacturerSubscriptionContext";

// ─────────────────────────────────────────────────────────────────────────────
// BusinessDocumentsGate — Solo plans don't need a company tax number or
// business license number, but every other plan does. A manufacturer on one
// of those plans without both on file (typically just after upgrading from
// Solo) can't use the dashboard until they add them: this dialog can't be
// dismissed, and comes back on every visit until they're submitted.
// ─────────────────────────────────────────────────────────────────────────────

export default function BusinessDocumentsGate() {
    const { profile } = useManufacturerProfile();
    const { subscription } = useManufacturerSubscription();
    const plan = getPricingPlan(subscription.planId);
    const isRequired =
        requiresBusinessDocuments(subscription.planId) && !hasBusinessDocuments(profile);

    return (
        // Ignores close requests (Escape, outside press) — it closes once the
        // details are submitted and isRequired turns false
        <Dialog open={isRequired} onOpenChange={() => {}} disablePointerDismissal>
            <DialogContent showCloseButton={false}>
                <div className="flex flex-col gap-1">
                    <DialogTitle>Add your business details</DialogTitle>
                    <DialogDescription>
                        Your {plan?.name ?? "new"} plan needs your company tax number and
                        business license number. Add them to keep using Mande.
                    </DialogDescription>
                </div>
                <BusinessDocumentsForm />
                <p className="text-center text-sm font-text text-mist-500">
                    Not ready yet?{" "}
                    <Link
                        href={ARTISAN_LOGIN_URL}
                        className="font-medium text-secondary-700 hover:underline"
                    >
                        Log out
                    </Link>
                </p>
            </DialogContent>
        </Dialog>
    );
}
