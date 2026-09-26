export type RegistrationFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    agreeToTerms: boolean;
    otp: string;
    companyName: string;
    companyAddress: string;
    companyTaxNumber: string;
    chambersOfCommerceNumber: string;
    staffRange: string;
    specialities: string[];
    productionLeadTime: string;
    materialsInventory: string;
};

export const STEP_FIELD_NAMES: Record<number, (keyof RegistrationFormValues)[]> = {
    0: ["firstName", "lastName", "email", "password", "agreeToTerms"],
    1: ["otp"],
    2: ["companyName", "companyAddress", "companyTaxNumber", "chambersOfCommerceNumber"],
    3: ["staffRange", "specialities", "productionLeadTime", "materialsInventory"],
};

export const REGISTRATION_DEFAULT_VALUES: RegistrationFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreeToTerms: false,
    otp: "",
    companyName: "",
    companyAddress: "",
    companyTaxNumber: "",
    chambersOfCommerceNumber: "",
    staffRange: "",
    specialities: [],
    productionLeadTime: "",
    materialsInventory: "",
};
