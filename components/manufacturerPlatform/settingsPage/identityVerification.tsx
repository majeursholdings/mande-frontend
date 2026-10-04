"use client";

import { useState } from "react";
import Image from "next/image";
import { IdCard } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import NinCardReuploadForm from "@/components/manufacturerPlatform/form/ninCardReuploadForm";
import type { VerificationStatus } from "@/constant/manufacturer";
import { Skeleton } from "@/components/ui/skeleton";
import Notice from "../notice";
import SettingsSection from "../settingsSection";
import VerificationBadge from "../verificationBadge";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";

// A rejection has its own notice, with the reason and a way to upload a new photo
const STATUS_NOTICES: Record<Exclude<VerificationStatus, "rejected">, string> = {
    pending: "Our team is reviewing your NIN card. We'll let you know once you're verified.",
    processing:
        "We're checking your NIN card against your details now. We'll let you know once you're verified.",
    manual_review:
        "Our team is taking a closer look at your NIN card. We'll let you know once you're verified.",
    verified: "Our team has checked your NIN card against your details.",
};

/**
 * The NIN card from sign-up, with where it is in verification. View only,
 * unless it's rejected — then a new photo can be uploaded for another review.
 */
export default function IdentityVerification() {
    const { profile, isLoading } = useManufacturerProfile();
    const { imageUrl, status, rejectionReason } = profile.ninCard;
    const [isReuploadOpen, setIsReuploadOpen] = useState(false);
    const isRejected = status === "rejected";

    if (isLoading) {
        return (
            <SettingsSection
                headingLevel="h3"
                title="NIN card"
                description="The ID you added when you signed up."
                action={<Skeleton className="h-6 w-20 rounded-full" />}
                className="first-of-type:border-t first-of-type:pt-6"
            >
                <Skeleton className="aspect-27/17 w-full max-w-sm rounded-xl" />
                <Skeleton className="h-12 w-full max-w-sm rounded-lg" />
            </SettingsSection>
        );
    }

    return (
        // Follows the Basic Info form, so it always shows its divider
        <SettingsSection
            headingLevel="h3"
            title="NIN card"
            description="The ID you added when you signed up."
            action={<VerificationBadge status={status} />}
            className="first-of-type:border-t first-of-type:pt-6"
        >

            {imageUrl ? (
                <div className="relative aspect-27/17 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-white">
                    <Image
                        src={imageUrl}
                        alt="Your NIN card"
                        fill
                        // Served as-is — uploads may be local previews or come from the API
                        unoptimized
                        className="object-contain"
                    />
                </div>
            ) : (
                <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border border-dashed border-mist-300 bg-white px-4 py-8 text-center">
                    <IdCard className="size-6 text-mist-400" strokeWidth={1.5} />
                    <p className="text-sm font-medium font-text text-mist-900">No NIN card on file</p>
                </div>
            )}

            <Notice tone={status === "verified" ? "info" : "warning"} className="max-w-sm">
                {status === "rejected"
                    ? `We couldn't verify this NIN card.${rejectionReason ? ` ${rejectionReason}` : ""} Upload a new photo to try again.`
                    : !imageUrl && status !== "verified"
                      ? "Contact support to add your NIN card and get verified."
                      : STATUS_NOTICES[status]}
            </Notice>

            {isRejected && (
                <div>
                    <button
                        type="button"
                        onClick={() => setIsReuploadOpen(true)}
                        className="h-9 rounded-button bg-secondary-700 px-4 text-sm font-medium font-text text-white transition-colors duration-200 cursor-pointer hover:bg-secondary-900"
                    >
                        Upload new NIN card
                    </button>
                </div>
            )}

            <Dialog open={isReuploadOpen} onOpenChange={setIsReuploadOpen}>
                <DialogContent>
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Upload a new NIN card</DialogTitle>
                        <DialogDescription>
                            We&apos;ll review your new photo and let you know once you&apos;re
                            verified.
                        </DialogDescription>
                    </div>
                    {rejectionReason && (
                        <Notice tone="warning">
                            Your last photo was rejected. {rejectionReason}
                        </Notice>
                    )}
                    <NinCardReuploadForm onSubmitted={() => setIsReuploadOpen(false)} />
                </DialogContent>
            </Dialog>
        </SettingsSection>
    );
}
