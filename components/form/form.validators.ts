import { RegisterOptions } from "react-hook-form";
import { DEFAULT_MAX_FILE_SIZE_MB } from "./fileRules";

/**
 * A Nigerian phone number however it's typed ("0801 234 5678", "+234 801 234
 * 5678", "234 801...", "+234 0801..."), as "+2348012345678", or null when it
 * isn't one. Mirrors mande-backend/src/utils/phone.ts, which stores every
 * number this way.
 */
export function normalizeNigerianPhone(input: string): string | null {
    const digits = input.trim().replace(/[\s().-]/g, "");
    if (!/^\+?\d+$/.test(digits)) return null;
    const bare = digits.replace(/^\+/, "");
    let national: string | null = null;
    if (/^2340?\d{10}$/.test(bare) && (bare.length === 13 || bare.length === 14)) national = bare.slice(-10);
    else if (/^0\d{10}$/.test(bare)) national = bare.slice(1);
    else if (/^[1-9]\d{9}$/.test(bare) && !digits.startsWith("+")) national = bare;
    return national && /^[1-9]\d{9}$/.test(national) ? `+234${national}` : null;
}

export const NIGERIAN_PHONE_MESSAGE = "Enter a Nigerian phone number, e.g. 0801 234 5678 or +234 801 234 5678";
export const PHONE_PLACEHOLDER = "0801 234 5678";

/** Whether `value` is a Nigerian phone number, typed any of the usual ways. */
export const isPhoneNumber = (value: string) => normalizeNigerianPhone(value) !== null;

/** Any phone number, for forms that take numbers from abroad (the website's contact form): digits with an optional leading "+". */
export const isInternationalPhoneNumber = (value: string) => /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, ""));

export const validators = {
    required: (label = "This field"): RegisterOptions => ({
        required: `${label} is required`,
    }),

    email: (): RegisterOptions => ({
        required: "Email address is required",
        pattern: {
            value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,8}$/i,
            message: "Please enter a valid email address",
        },
    }),

    // Same shape as email(), but restricted to a single company domain —
    // used for internal-only forms like admin invites, not general signup.
    companyEmail: (domain = "mande.com.ng"): RegisterOptions => ({
        required: "Email address is required",
        pattern: {
            value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,8}$/i,
            message: "Please enter a valid email address",
        },
        validate: (value: string) =>
            value?.toLowerCase().trim().endsWith(`@${domain}`) ||
            `Email must be a @${domain} address`,
    }),

    password: (): RegisterOptions => ({
        required: "Password is required",
        minLength: {
            value: 8,
            message: "Password must be at least 8 characters",
        },
        pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
            message:
                "Password must include uppercase, lowercase, number and special character",
        },
    }),

    confirmPassword: (
        getValues: () => Record<string, unknown>,
        fieldName = "password",
    ): RegisterOptions => ({
        required: "Please confirm your password",
        validate: (value: string) =>
            value === getValues()[fieldName] || "Passwords do not match",
    }),

    phone: (): RegisterOptions => ({
        required: "Phone number is required",
        maxLength: { value: 20, message: "Phone number is too long" },
        validate: (value: string) => isPhoneNumber(value) || NIGERIAN_PHONE_MESSAGE,
    }),

    name: (label = "Name"): RegisterOptions => ({
        required: `${label} is required`,
        minLength: {
            value: 2,
            message: `${label} must be at least 2 characters`,
        },
        pattern: {
            value: /^[a-zA-Z\s'-]+$/,
            message: `${label} can only contain letters, spaces, hyphens and apostrophes`,
        },
    }),

    amount: (min = 1000): RegisterOptions => ({
        required: "Amount is required",
        min: {
            value: min,
            message: `Minimum amount is $${min.toLocaleString("en-US")}`, // ← USD
        },
        pattern: {
            value: /^\d+(\.\d{1,2})?$/,
            message: "Enter a valid amount",
        },
    }),

    url: (): RegisterOptions => ({
        pattern: {
            value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            message: "Please enter a valid URL",
        },
    }),

    file: ({
        required = true,
        maxSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
        maxTotalSizeMB,
        maxFiles,
        accept,
    }: {
        required?: boolean;
        maxSizeMB?: number;
        maxTotalSizeMB?: number;
        maxFiles?: number;
        accept?: string[];
    } = {}): RegisterOptions => ({
        ...(required && {
            required: "Please upload a file",
        }),

        validate: {
            requiredFile: (files: FileList | File[]) => {
                if (!required) return true;

                return files?.length > 0 || "Please upload at least one file";
            },

            maxFiles: (files: FileList | File[]) => {
                if (!files || !maxFiles) return true;

                return (
                    files.length <= maxFiles ||
                    `You can upload a maximum of ${maxFiles} files`
                );
            },

            fileSize: (files: FileList | File[]) => {
                if (!files?.length) return true;

                const oversized = Array.from(files).find(
                    (file) => file.size / (1024 * 1024) > maxSizeMB,
                );

                return (
                    !oversized ||
                    `${oversized.name} exceeds the ${maxSizeMB}MB limit`
                );
            },

            totalSize: (files: FileList | File[]) => {
                if (!files?.length || !maxTotalSizeMB) return true;

                const total =
                    Array.from(files).reduce(
                        (sum, file) => sum + file.size,
                        0,
                    ) /
                    (1024 * 1024);

                return (
                    total <= maxTotalSizeMB ||
                    `Total upload size must not exceed ${maxTotalSizeMB}MB`
                );
            },

            fileType: (files: FileList | File[]) => {
                if (!files?.length || !accept?.length) return true;

                const invalid = Array.from(files).find(
                    (file) => !accept.includes(file.type),
                );

                return (
                    !invalid || `${invalid.name} is not a supported file type`
                );
            },
        },
    }),

    minLength: (length: number, label = "This field"): RegisterOptions => ({
        minLength: {
            value: length,
            message: `${label} must be at least ${length} characters`,
        },
    }),

    maxLength: (length: number, label = "This field"): RegisterOptions => ({
        maxLength: {
            value: length,
            message: `${label} must not exceed ${length} characters`,
        },
    }),

    checkbox: (label = "This field"): RegisterOptions => ({
        validate: (value: boolean) =>
            value === true || `${label} must be checked to proceed`,
    }),
};