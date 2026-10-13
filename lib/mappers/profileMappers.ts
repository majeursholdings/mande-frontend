import type {
    DocumentVerification,
    ManufacturerAddress,
    ManufacturerNinCard,
    ManufacturerProfile,
    VerificationStatus,
} from "@/constant/manufacturer";
import { EMPTY_MANUFACTURER_PROFILE, PENDING_VERIFICATION } from "@/constant/manufacturer";
import type { SelectOption } from "@/components/form/types";

/**
 * Option values the API still accepts from older sign-ups, but that the forms
 * no longer offer. They get a label for display only, never a select option.
 */
const LEGACY_OPTION_LABELS: Record<string, string> = {
    "1-5": "1 to 5",
    "6-10": "6 to 10",
    "2-4-weeks": "2 to 4 weeks",
};

/** Whether `value` is one the forms no longer offer (see LEGACY_OPTION_LABELS). */
export function isLegacyOptionValue(value: string): boolean {
    return value in LEGACY_OPTION_LABELS;
}

/**
 * The label for a profile option value: the current option's label, else a
 * legacy value's label, else the value itself. "" stays "" (not set).
 */
export function getProfileOptionLabel(options: SelectOption[], value: string | null | undefined): string {
    if (!value) return "";
    return options.find((option) => option.value === value)?.label ?? LEGACY_OPTION_LABELS[value] ?? value;
}

export interface ApiProfilePayload {
    userId?: string | null;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    dateOfBirth?: string | Date | null;
    avatar?: { url?: string; name?: string | null; kind?: string } | null;
    avatarUrl?: string | null;
    joinedAt?: string | Date | null;
    companyName?: string;
    address?: Partial<ManufacturerAddress>;
    companyAddress?: Partial<ManufacturerAddress>;
    specialities?: string[];
    staffRange?: string | null;
    productionLeadTime?: string | null;
    materialsInventory?: string | null;
    twoFactorMethod?: "app" | "email" | "sms" | null;
    kyc?: {
        status?: VerificationStatus;
        needsBusinessDocuments?: boolean;
        nin?: {
            status?: VerificationStatus;
            rejectionReason?: string | null;
            last4?: string | null;
            image?: { url?: string } | null;
        };
        companyTaxNumber?: {
            value?: string;
            status?: VerificationStatus;
            rejectionReason?: string | null;
        };
        businessLicenseNumber?: {
            value?: string;
            status?: VerificationStatus;
            rejectionReason?: string | null;
        };
    };
    [key: string]: unknown;
}

export function mapApiProfileToManufacturerProfile(
    apiData: ApiProfilePayload | { profile?: ApiProfilePayload } | Record<string, unknown> | null | undefined,
    fallback: ManufacturerProfile = EMPTY_MANUFACTURER_PROFILE
): ManufacturerProfile {
    if (!apiData) return fallback;

    const data: ApiProfilePayload =
        apiData && "profile" in apiData && apiData.profile
            ? (apiData.profile as ApiProfilePayload)
            : (apiData as ApiProfilePayload);

    const kyc = data.kyc;

    let formattedDob: string | null = fallback.dateOfBirth;
    if (data.dateOfBirth) {
        if (typeof data.dateOfBirth === "string") {
            formattedDob = data.dateOfBirth.slice(0, 10);
        } else if (data.dateOfBirth instanceof Date && !isNaN(data.dateOfBirth.getTime())) {
            formattedDob = data.dateOfBirth.toISOString().slice(0, 10);
        }
    }

    let formattedJoinedAt: string | null = fallback.joinedAt;
    if (data.joinedAt) {
        if (typeof data.joinedAt === "string") {
            formattedJoinedAt = data.joinedAt;
        } else if (data.joinedAt instanceof Date && !isNaN(data.joinedAt.getTime())) {
            formattedJoinedAt = data.joinedAt.toISOString();
        }
    }

    const companyAddress: ManufacturerAddress = {
        streetAddress:
            data.address?.streetAddress ??
            data.companyAddress?.streetAddress ??
            fallback.companyAddress.streetAddress ??
            "",
        city: data.address?.city ?? data.companyAddress?.city ?? fallback.companyAddress.city ?? "",
        state:
            data.address?.state ?? data.companyAddress?.state ?? fallback.companyAddress.state ?? "",
        country:
            data.address?.country ??
            data.companyAddress?.country ??
            fallback.companyAddress.country ??
            "",
    };

    const taxVerification: DocumentVerification = kyc?.companyTaxNumber?.status
        ? {
              status: kyc.companyTaxNumber.status,
              rejectionReason: kyc.companyTaxNumber.rejectionReason ?? null,
          }
        : fallback.companyTaxNumberVerification ?? PENDING_VERIFICATION;

    const licenseVerification: DocumentVerification = kyc?.businessLicenseNumber?.status
        ? {
              status: kyc.businessLicenseNumber.status,
              rejectionReason: kyc.businessLicenseNumber.rejectionReason ?? null,
          }
        : fallback.businessLicenseNumberVerification ?? PENDING_VERIFICATION;

    const ninCard: ManufacturerNinCard = kyc?.nin
        ? {
              imageUrl: kyc.nin.image?.url ?? fallback.ninCard.imageUrl ?? null,
              status: kyc.nin.status ?? fallback.ninCard.status ?? "pending",
              rejectionReason: kyc.nin.rejectionReason ?? null,
          }
        : fallback.ninCard;

    return {
        firstName: data.firstName ?? fallback.firstName ?? "",
        lastName: data.lastName ?? fallback.lastName ?? "",
        email: data.email ?? fallback.email ?? "",
        phoneNumber: data.phone ?? data.phoneNumber ?? fallback.phoneNumber ?? "",
        dateOfBirth: formattedDob,
        avatarUrl: data.avatar?.url ?? data.avatarUrl ?? fallback.avatarUrl ?? null,
        joinedAt: formattedJoinedAt,
        companyName: data.companyName ?? fallback.companyName ?? "",
        companyTaxNumber:
            kyc?.companyTaxNumber?.value ?? fallback.companyTaxNumber ?? "",
        companyTaxNumberVerification: taxVerification,
        businessLicenseNumber:
            kyc?.businessLicenseNumber?.value ?? fallback.businessLicenseNumber ?? "",
        businessLicenseNumberVerification: licenseVerification,
        companyAddress,
        specialities: Array.isArray(data.specialities) ? data.specialities : fallback.specialities,
        staffRange: data.staffRange ?? fallback.staffRange ?? "",
        productionLeadTime: data.productionLeadTime ?? fallback.productionLeadTime ?? "",
        materialsInventory: data.materialsInventory ?? fallback.materialsInventory ?? "",
        ninCard,
        security: {
            linkedAccounts: fallback.security.linkedAccounts,
            twoFactorMethod:
                data.twoFactorMethod === "app" || data.twoFactorMethod === "email"
                    ? data.twoFactorMethod
                    : null,
        },
    };
}
