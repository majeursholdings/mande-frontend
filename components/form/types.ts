import { HTMLAttributes, ReactNode } from "react";
import { FieldValues, RegisterOptions, UseFormReturn } from "react-hook-form";

export type FieldType =
    | "text"
    | "email"
    | "password"
    | "tel"
    | "number"
    | "number-dollar"
    | "amount" // money — digits only, shown as "₦300,000"; the value is the digit string
    | "textarea"
    | "select"
    | "combobox" // a select you can type into to filter its options
    | "multiselect"
    | "radio"
    | "date"
    | "datetime"
    | "file"
    | "image"
    | "checkbox";

export type SelectOption = {
    label: string;
    value: string;
};

export type FormFieldConfig = {
    name: string;
    type: FieldType;
    label?: ReactNode; // string, or JSX (e.g. a checkbox label with an inline link)
    placeholder?: string;
    description?: string; // helper text below the field
    icon?: ReactNode; // optional leading icon for text inputs
    uploadIcon?: ReactNode; // custom icon for file/image upload
    accept?: string; // for file/image — e.g. "image/png, image/jpeg"
    multiple?: boolean; // for file upload
    options?: SelectOption[]; // for select / combobox / multiselect / radio fields
    maxSelections?: number; // for multiselect — caps how many options can be chosen
    // For async select / combobox fields — the field suspends until it
    // resolves, so return the same (cached) promise on every call.
    loadOptions?: () => Promise<SelectOption[]>;
    emptyMessage?: string; // for combobox — shown when no option matches the search
    currencySymbol?: string; // for amount — defaults to ₦
    rows?: number; // for textarea
    height?: number;
    min?: number | string;
    max?: number | string;
    step?: number;
    minDate?: Date | string; // for date/datetime — disables earlier dates
    isDateDisabled?: (date: Date) => boolean;
    autoComplete?: string;
    inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"]; // e.g. "numeric" for an account number
    maxLength?: number;
    readOnly?: boolean; // shown but not editable — e.g. a value filled in by a lookup
    validation?: RegisterOptions;
    defaultValue?: string | number | boolean;
    className?: string;
    disabled?: boolean;
    capture?: "user" | "environment";
    maxFiles?: number;
    maxSizeMB?: number;
    showPreview?: boolean;
    clearable?: boolean; // for select — an × in the field clears the choice
    trailingSlot?: ReactNode; // e.g. a "Forgot password?" link next to a checkbox
};

export type MainFormProps<T extends FieldValues = FieldValues> = {
    title?: string;
    description?: string;
    fields: FormFieldConfig[];
    onSubmit: (values: T) => void | Promise<void>;
    submitLabel?: string;
    isLoading?: boolean;
    className?: string;
    rowPairs?: [string, string][];
    footerSlot?: ReactNode | ((values: Partial<T>) => ReactNode);
    /** Bring your own react-hook-form instance — lets several MainForm/field
     * groups (e.g. steps of a wizard) share one form so values and validation
     * persist as steps mount/unmount. Falls back to an internal instance. */
    methods?: UseFormReturn<T>;
    /** Disable the submit button until every required field currently holds a
     * value (checked on each render from live field values, not on submit).
     * @default true */
    requireValidToSubmit?: boolean;
    /** Replace the default full-width submit button with custom footer
     * actions (e.g. a Back + Continue row). Receives the same loading/submit
     * readiness state the default button would use. */
    renderFooter?: (state: { isLoading: boolean; canSubmit: boolean }) => ReactNode;
    /** gap-* classes for the space between fields, and between the two fields of a
     * row pair — e.g. "gap-6 md:gap-y-8 md:gap-x-6" for a roomier form.
     * @default "gap-4" */
    fieldGapClassName?: string;
    /** Leave the red asterisk off required fields' labels — e.g. a login form, where every field is required.
     * @default false */
    hideRequiredMarks?: boolean;
};