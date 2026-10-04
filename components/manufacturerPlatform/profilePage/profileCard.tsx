import type { ReactNode } from "react";
import Link from "next/link";
import { Award, Building2, Mail, MapPin, Pencil, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthYear } from "@/lib/date";
import {
    COMPANY_SPECIALITY_OPTIONS,
    MANUFACTURER_SETTINGS_URL,
    formatAddress,
    getManufacturerFullName,
    getOptionLabel,
    type ManufacturerProfile,
    type VerificationStatus,
} from "@/constant/manufacturer";
import UserAvatar from "@/components/ui/userAvatar";
import VerificationBadge from "../verificationBadge";

/** Lets an email wrap after the "@" in a narrow column instead of mid-word. */
export function breakableEmail(email: string): ReactNode {
    const at = email.indexOf("@");
    if (at === -1) return email;
    return (
        <>
            {email.slice(0, at + 1)}
            <wbr />
            {email.slice(at + 1)}
        </>
    );
}

/**
 * Avatar, name and company details — a card on desktop, a centered header on
 * mobile. Also the admin's view of a manufacturer, without the Edit link and
 * with their overall verification in the badge.
 */
export default function ProfileCard({
    profile,
    className,
    editHref = MANUFACTURER_SETTINGS_URL,
    verificationStatus,
    loading = false,
}: {
    profile: ManufacturerProfile;
    /** Skeletons in place of the profile's details while it loads. */
    loading?: boolean;
    className?: string;
    /** Where "Edit" goes — null leaves it out. */
    editHref?: string | null;
    /** The badge beside the name — defaults to the NIN card's status. */
    verificationStatus?: VerificationStatus;
}) {
    const specialities = profile.specialities
        .map((value) => getOptionLabel(COMPANY_SPECIALITY_OPTIONS, value))
        .join(", ");

    return (
        <ProfileDetailsCard
            name={getManufacturerFullName(profile)}
            avatarUrl={profile.avatarUrl}
            joinedAt={profile.joinedAt}
            badge={
                verificationStatus ? (
                    <VerificationBadge status={verificationStatus} />
                ) : (
                    <VerificationBadge status={profile.ninCard.status} rejectedLabel="ID rejected" />
                )
            }
            details={[
                { label: "Company", value: profile.companyName, icon: Building2 },
                { label: "Email", value: profile.email, icon: Mail, format: breakableEmail },
                { label: "Speciality", value: specialities, icon: Award },
                { label: "Location", value: formatAddress(profile.companyAddress), icon: MapPin },
            ]}
            editHref={editHref}
            className={className}
            loading={loading}
        />
    );
}

export type ProfileDetail = {
    label: string;
    /** "" shows `emptyLabel`. */
    value: string;
    icon: LucideIcon;
    format?: (value: string) => ReactNode;
    /** Shown while `value` is empty. Defaults to "Not provided". */
    emptyLabel?: string;
};

/** ProfileCard's layout for any account — e.g. an admin's, with their own details. */
export function ProfileDetailsCard({
    name,
    avatarUrl,
    joinedAt,
    badge,
    details,
    editHref,
    className,
    loading = false,
}: {
    name: string;
    avatarUrl: string | null;
    /** ISO date. Null hides the "Joined" line. */
    joinedAt: string | null;
    /** Beside the name, e.g. a verification badge. */
    badge?: ReactNode;
    details: ProfileDetail[];
    /** Where "Edit" goes — null leaves it out. */
    editHref: string | null;
    className?: string;
    /** Skeletons in place of the avatar, name, badge, joined date and values (labels still show). */
    loading?: boolean;
}) {
    return (
        <section
            className={cn(
                "relative flex flex-col gap-5 border-b border-border pb-6 lg:rounded-xl lg:border lg:bg-white lg:p-5",
                className,
            )}
        >
            {editHref && (
                <Link
                    href={editHref}
                    className="absolute top-0 right-0 lg:top-5 lg:right-5 flex items-center gap-1 text-sm font-medium font-text text-secondary-600 hover:underline"
                >
                    <Pencil className="size-3.5" />
                    Edit
                </Link>
            )}

            <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                {loading ? (
                    <Skeleton className="size-22 rounded-full" />
                ) : (
                    <UserAvatar name={name} src={avatarUrl} className="size-22 text-2xl" />
                )}
                {loading ? (
                    <div className="flex flex-col items-center gap-2 lg:items-start">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                ) : (
                <div className="flex flex-col items-center gap-1 lg:items-start">
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                        <h2
                            className={cn(
                                "text-lg font-semibold font-text",
                                name ? "text-mist-950" : "text-mist-400",
                            )}
                        >
                            {name || "Name not provided"}
                        </h2>
                        {badge}
                    </div>
                    {joinedAt && (
                        <p className="text-xs font-text text-mist-400">
                            Joined {formatMonthYear(new Date(joinedAt))}
                        </p>
                    )}
                </div>
                )}
            </div>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 lg:grid-cols-1">
                {details.map((detail) => (
                    <li key={detail.label} className="flex min-w-0 items-start gap-3">
                        <span className="flex size-8 lg:size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                            <detail.icon className="size-4 lg:size-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-text text-mist-500">{detail.label}</p>
                            {loading ? (
                                <Skeleton className="mt-1 h-4 w-28" />
                            ) : (
                            <p
                                className={cn(
                                    "text-sm font-text wrap-anywhere",
                                    detail.value ? "text-mist-900" : "text-mist-400",
                                )}
                            >
                                {detail.value
                                    ? (detail.format?.(detail.value) ?? detail.value)
                                    : (detail.emptyLabel ?? "Not provided")}
                            </p>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

