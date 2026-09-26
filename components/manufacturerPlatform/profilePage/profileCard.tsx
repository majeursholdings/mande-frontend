import type { ReactNode } from "react";
import Link from "next/link";
import { Award, Building2, Mail, MapPin, Pencil, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMonthYear } from "@/lib/date";
import {
    COMPANY_SPECIALITY_OPTIONS,
    MANUFACTURER_SETTINGS_URL,
    formatAddress,
    getManufacturerFullName,
    getOptionLabel,
    type ManufacturerProfile,
} from "@/constant/manufacturer";
import UserAvatar from "../dashboardLayout/userAvatar";
import VerificationBadge from "../verificationBadge";

/** Lets an email wrap after the "@" in a narrow column instead of mid-word. */
function breakableEmail(email: string): ReactNode {
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

/** Avatar, name and company details — a card on desktop, a centered header on mobile. */
export default function ProfileCard({
    profile,
    className,
}: {
    profile: ManufacturerProfile;
    className?: string;
}) {
    const fullName = getManufacturerFullName(profile);
    const specialities = profile.specialities
        .map((value) => getOptionLabel(COMPANY_SPECIALITY_OPTIONS, value))
        .join(", ");

    const details: {
        label: string;
        value: string;
        icon: LucideIcon;
        format?: (value: string) => ReactNode;
    }[] = [
        { label: "Company", value: profile.companyName, icon: Building2 },
        { label: "Email", value: profile.email, icon: Mail, format: breakableEmail },
        { label: "Speciality", value: specialities, icon: Award },
        { label: "Location", value: formatAddress(profile.companyAddress), icon: MapPin },
    ];

    return (
        <section
            className={cn(
                "relative flex flex-col gap-5 border-b border-border pb-6 lg:rounded-xl lg:border lg:bg-white lg:p-5",
                className,
            )}
        >
            <Link
                href={MANUFACTURER_SETTINGS_URL}
                className="absolute top-0 right-0 lg:top-5 lg:right-5 flex items-center gap-1 text-sm font-medium font-text text-secondary-600 hover:underline"
            >
                <Pencil className="size-3.5" />
                Edit
            </Link>

            <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                <UserAvatar name={fullName} src={profile.avatarUrl} className="size-22 text-2xl" />
                <div className="flex flex-col items-center gap-1 lg:items-start">
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                        <h2
                            className={cn(
                                "text-lg font-semibold font-text",
                                fullName ? "text-mist-950" : "text-mist-400",
                            )}
                        >
                            {fullName || "Name not provided"}
                        </h2>
                        <VerificationBadge status={profile.ninCard.status} rejectedLabel="ID rejected" />
                    </div>
                    {profile.joinedAt && (
                        <p className="text-xs font-text text-mist-400">
                            Joined {formatMonthYear(new Date(profile.joinedAt))}
                        </p>
                    )}
                </div>
            </div>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 lg:grid-cols-1">
                {details.map((detail) => (
                    <li key={detail.label} className="flex min-w-0 items-start gap-3">
                        <span className="flex size-8 lg:size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                            <detail.icon className="size-4 lg:size-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-text text-mist-500">{detail.label}</p>
                            <p
                                className={cn(
                                    "text-sm font-text wrap-anywhere",
                                    detail.value ? "text-mist-900" : "text-mist-400",
                                )}
                            >
                                {detail.value
                                    ? (detail.format?.(detail.value) ?? detail.value)
                                    : "Not provided"}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
