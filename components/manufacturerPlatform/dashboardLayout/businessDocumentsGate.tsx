"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import BusinessDocumentsForm from "@/components/manufacturerPlatform/form/businessDocumentsForm";
import { hasBusinessDocuments } from "@/constant/manufacturer";
import { requiresBusinessDocuments } from "@/constant/plans";
import { useLogout } from "./logoutContext";
import { useManufacturerProfile } from "./manufacturerProfileContext";
import { useManufacturerSubscription } from "./manufacturerSubscriptionContext";
import { usePlans } from "@/hooks/usePlans";

// ─────────────────────────────────────────────────────────────────────────────
// BusinessDocumentsGate — Solo plans don't need a company tax number or
// business license number, but every other plan does. A manufacturer on one
// of those plans without both on file (typically just after upgrading from
// Solo) can't use the dashboard until they add them: this dialog can't be
// dismissed, and comes back on every visit until they're submitted.
// ─────────────────────────────────────────────────────────────────────────────

export default function BusinessDocumentsGate() {
    const { profile, isLoading: isProfileLoading } = useManufacturerProfile();
    const { subscription, isLoading: isSubscriptionLoading } = useManufacturerSubscription();
    const { requestLogout } = useLogout();
    const planId = subscription?.planId ?? "";
    const { getPlan } = usePlans();
    const plan = getPlan(planId);
    // Not until the profile has loaded: before then it has no documents on file
    const isRequired =
        !isProfileLoading &&
        !isSubscriptionLoading &&
        !!planId &&
        requiresBusinessDocuments(planId) &&
        !hasBusinessDocuments(profile);

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
                    <button
                        type="button"
                        onClick={requestLogout}
                        className="cursor-pointer font-medium text-secondary-700 hover:underline"
                    >
                        Log out
                    </button>
                </p>
            </DialogContent>
        </Dialog>
    );
}
