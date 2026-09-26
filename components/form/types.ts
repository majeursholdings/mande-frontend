import { ReactNode } from "react";
import { FieldValues, RegisterOptions, UseFormReturn } from "react-hook-form";

export type FieldType =
    | "text"
    | "email"
    | "password"
    | "tel"
    | "number"
    | "number-dollar"
    | "textarea"
    | "select"
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
    options?: SelectOption[]; // for select / multiselect / radio fields
    maxSelections?: number; // for multiselect — caps how many options can be chosen
    loadOptions?: () => Promise<SelectOption[]>; // ← add this for async selects
    rows?: number; // for textarea
    height?: number;
    min?: number | string;
    max?: number | string;
    step?: number;
    minDate?: Date | string; // for date/datetime — disables earlier dates
    isDateDisabled?: (date: Date) => boolean;
    autoComplete?: string;
    validation?: RegisterOptions;
    defaultValue?: string | number | boolean;
    className?: string;
    disabled?: boolean;
    capture?: "user" | "environment";
    maxFiles?: number;
    maxSizeMB?: number;
    showPreview?: boolean;
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
};