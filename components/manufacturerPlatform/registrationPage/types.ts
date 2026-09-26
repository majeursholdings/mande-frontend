import { isSoloPlan, type BillingCycle } from "@/constant/sampleData";
import type { AddressFormValues } from "@/components/manufacturerPlatform/form/addressFields";

export {
    SOLO_PLAN_ID,
    getPlanPrice,
    getPricingPlan,
    isSoloPlan,
    type BillingCycle,
} from "@/constant/sampleData";

export type RegistrationFormValues = AddressFormValues & {
    // Step 1 — user details (the account is created when this step is done)
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    agreeToTerms: boolean;
    // Step 2 — verify email
    otp: string;
    // Step 3 — plan and payment
    /** A PRICING_PLANS id, e.g. "solo". */
    plan: string;
    billingCycle: BillingCycle;
    // Step 4 — about company & documents (plus the address fields)
    companyName: string;
    companyTaxNumber: string;
    businessLicenseNumber: string;
    /** Photo of the manufacturer's NIN (National Identification Number) card. */
    ninCard: FileList | null;
    // Step 5 — company specifications
    staffRange: string;
    specialities: string[];
    productionLeadTime: string;
    materialsInventory: string;
};

export const REGISTRATION_DEFAULT_VALUES: RegistrationFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreeToTerms: false,
    otp: "",
    plan: "",
    billingCycle: "monthly",
    companyName: "",
    streetAddress: "",
    city: "",
    country: "",
    state: "",
    companyTaxNumber: "",
    businessLicenseNumber: "",
    ninCard: null,
    staffRange: "",
    specialities: [],
    productionLeadTime: "",
    materialsInventory: "",
};

/** The fields a step needs filled in — drives the side panel's step checkmarks. */
export function getStepRequiredFields(
    stepIndex: number,
    plan: string,
): (keyof RegistrationFormValues)[] {
    switch (stepIndex) {
        case 0:
            return ["firstName", "lastName", "email", "password", "agreeToTerms"];
        case 1:
            return ["otp"];
        case 2:
            return ["plan"];
        case 3:
            return [
                "companyName",
                "streetAddress",
                "city",
                "country",
                "state",
                ...(isSoloPlan(plan)
                    ? []
                    : (["companyTaxNumber", "businessLicenseNumber"] as const)),
                "ninCard",
            ];
        case 4:
            return ["staffRange", "specialities", "productionLeadTime", "materialsInventory"];
        default:
            return [];
    }
}
