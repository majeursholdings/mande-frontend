import { manufacturerService } from "@/lib/services/manufacturerService";
import type { RegistrationFormValues } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// What sign-up's last two steps send to the API, shared by the sign-up wizard
// and the dashboard's SignUpGate (which picks sign-up up again after paying,
// for someone whose payment didn't go through the first time).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 4: the company details, then the NIN (its card photo was uploaded when
 * it was picked) and any business documents.
 */
export async function saveCompanyDetails(values: RegistrationFormValues): Promise<void> {
    if (!values.ninCard?.publicId) {
        throw new Error("Wait for your NIN card photo to finish uploading");
    }
    await manufacturerService.updateCompanyInfo({
        companyName: values.companyName.trim(),
        streetAddress: values.streetAddress.trim(),
        city: values.city.trim(),
        state: values.state,
        country: values.country,
    });
    await manufacturerService.submitNin({
        ninNumber: values.ninNumber.trim(),
        image: values.ninCard.publicId,
    });
    const companyTaxNumber = values.companyTaxNumber.trim();
    const businessLicenseNumber = values.businessLicenseNumber.trim();
    // Optional on the Solo plan: only sent when there's one to check
    if (companyTaxNumber || businessLicenseNumber) {
        await manufacturerService.submitBusinessDocuments({
            ...(companyTaxNumber && { companyTaxNumber }),
            ...(businessLicenseNumber && { businessLicenseNumber }),
        });
    }
}

/** Step 5: how the company works. */
export async function saveCompanySpecifications(values: RegistrationFormValues): Promise<void> {
    const { staffRange, specialities, productionLeadTime, materialsInventory } = values;
    await manufacturerService.updateCompanyInfo({ staffRange, specialities, productionLeadTime, materialsInventory });
}
