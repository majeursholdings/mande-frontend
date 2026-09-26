import type { FormFieldConfig } from "@/components/form/types";
import { AFRICAN_COUNTRY_OPTIONS, getStateOptions } from "@/constant/africanCountries";

/** A company address as form values — shared by sign-up and the edit profile page. */
export type AddressFormValues = {
    streetAddress: string;
    city: string;
    /** ISO country code, e.g. "NG". */
    country: string;
    state: string;
};

/** Lay these out side by side with MainForm's `rowPairs`. */
export const ADDRESS_ROW_PAIRS: [string, string][] = [["country", "state"]];

// Trimmed so a value made of only spaces doesn't pass
const notBlank = (label: string) => (value: string) =>
    value.trim().length > 0 || `${label} is required`;

/**
 * Street address, city, country and state fields for MainForm. Country comes
 * before state because the state list depends on it — pass the form's
 * current `country` (from useWatch) and an `onCountryChange` that clears the
 * chosen state, since it won't belong to the new country.
 */
export function getAddressFields({
    country,
    onCountryChange,
}: {
    country: string;
    onCountryChange: () => void;
}): FormFieldConfig[] {
    return [
        {
            name: "streetAddress",
            type: "text",
            label: "Street address",
            placeholder: "e.g. 20, Peacock Drive",
            autoComplete: "street-address",
            validation: {
                required: "Street address is required",
                validate: notBlank("Street address"),
            },
        },
        {
            name: "city",
            type: "text",
            label: "City",
            placeholder: "e.g. Lekki",
            autoComplete: "address-level2",
            validation: { required: "City is required", validate: notBlank("City") },
        },
        {
            name: "country",
            type: "combobox",
            label: "Country",
            placeholder: "e.g. Nigeria",
            options: AFRICAN_COUNTRY_OPTIONS,
            emptyMessage: "No African country matches your search",
            validation: { required: "Please select your country", onChange: onCountryChange },
        },
        {
            name: "state",
            type: "combobox",
            label: "State",
            placeholder: country ? "e.g. Lagos" : "Select a country first",
            options: getStateOptions(country),
            disabled: !country,
            emptyMessage: "No state matches your search",
            validation: { required: "Please select your state" },
        },
    ];
}
