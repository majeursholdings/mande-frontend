"use client";

import Image from "next/image";
import { IdCard } from "lucide-react";
import Notice from "../notice";
import VerificationBadge from "../verificationBadge";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";

/** The NIN card from sign-up, with whether an admin has verified it. View only. */
export default function IdentityVerification() {
    const { profile } = useManufacturerProfile();
    const { imageUrl, isVerified } = profile.ninCard;

    return (
        <section className="flex flex-col gap-4 border-t border-border pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-medium font-text text-mist-950">NIN card</h3>
                    <p className="text-sm font-text text-mist-500">
                        The ID you added when you signed up.
                    </p>
                </div>
                <VerificationBadge isVerified={isVerified} />
            </div>

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

            <Notice tone={isVerified ? "info" : "warning"} className="max-w-sm">
                {isVerified
                    ? "Our team has checked your NIN card against your details."
                    : imageUrl
                      ? "Our team is reviewing your NIN card. We'll let you know once you're verified."
                      : "Contact support to add your NIN card and get verified."}
            </Notice>
        </section>
    );
}
