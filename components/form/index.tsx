"use client";

import { useState, useRef, use, Suspense, useMemo } from "react";
import {
    useForm,
    Controller,
    Control,
    UseFormRegister,
    FieldValues,
    Path,
    PathValue,
    RegisterOptions,
    FieldErrors,
    useWatch,
    useFormContext,
} from "react-hook-form";
import dayjs from "dayjs";
import {
    CalendarIcon,
    EyeIcon,
    EyeOffIcon,
    UploadIcon,
    ImageIcon,
    TriangleAlert,
    Loader2,
    XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_CURRENCY } from "@/constant/global";

import { FormFieldConfig, MainFormProps, SelectOption } from "./types";
import Image from "next/image";

export default function MainForm<T extends FieldValues = FieldValues>({
    title,
    description,
    fields,
    onSubmit,
    submitLabel = "Submit",
    isLoading = false,
    className,
    rowPairs = [],
    footerSlot,
    methods,
    requireValidToSubmit = true,
    renderFooter,
    fieldGapClassName,
    hideRequiredMarks = false,
}: MainFormProps<T>) {
    // Hooks must run unconditionally — when a shared `methods` instance is
    // passed in (e.g. steps of a wizard), this internal one is simply unused.
    const internalForm = useForm<T>({ mode: "onTouched" });
    const {
        register,
        handleSubmit,
        control,
        getValues,
        formState: { errors },
    } = methods ?? internalForm;

    // Lets a parent read live field values (e.g. for a "preview" action) without
    // needing to submit the form — MainForm owns its own useForm() internally,
    // so this is the only way out for a config-driven form like this one.
    const watchedValues = useWatch({ control });

    const hasValue = (field: FormFieldConfig, value: unknown): boolean => {
        if (field.type === "checkbox") return value === true;
        if (field.type === "multiselect") return Array.isArray(value) && value.length > 0;
        return value !== undefined && value !== null && value !== "";
    };

    // required/select/radio-style fields are commonly validated with a
    // `validate` function rather than the `required` key (e.g. "must be
    // checked", "must pick at least one") — treat those as required too.
    const isFieldRequired = (field: FormFieldConfig): boolean =>
        !!field.validation?.required ||
        ((field.type === "checkbox" ||
            field.type === "multiselect" ||
            field.type === "radio") &&
            !!field.validation);

    const canSubmit =
        !requireValidToSubmit ||
        fields
            .filter(isFieldRequired)
            .every((field) => hasValue(field, watchedValues?.[field.name]));

    const renderedPairs = new Set<string>();

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className={cn("flex flex-col gap-5", className)}
            noValidate
        >
            {(title || description) && (
                <div className="flex flex-col gap-1">
                    {title && (
                        <h4 className="text-[#1F2937] text-lg font-bold font-text leading-6">
                            {title}
                        </h4>
                    )}
                    {description && (
                        <p className="text-[#6B7280] text-sm font-normal font-text leading-5">
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div className={cn("flex flex-col gap-4", fieldGapClassName)}>
                {fields.map((field) => {
                    const pair = rowPairs.find((p) => p.includes(field.name));

                    if (pair) {
                        if (renderedPairs.has(pair[0])) return null;
                        renderedPairs.add(pair[0]);

                        const secondField = fields.find(
                            (f) => f.name === pair[1],
                        );
                        if (!secondField) return null;

                        return (
                            <div
                                key={pair.join("-")}
                                className={cn("flex flex-col md:flex-row gap-4", fieldGapClassName)}
                            >
                                <FormField
                                    field={field}
                                    register={register}
                                    control={control}
                                    getValues={getValues}
                                    errors={errors}
                                    hideRequiredMark={hideRequiredMarks}
                                />
                                <FormField
                                    field={secondField}
                                    register={register}
                                    control={control}
                                    getValues={getValues}
                                    errors={errors}
                                    hideRequiredMark={hideRequiredMarks}
                                />
                            </div>
                        );
                    }

                    return (
                        <FormField
                            key={field.name}
                            field={field}
                            register={register}
                            control={control}
                            getValues={getValues}
                            errors={errors}
                            hideRequiredMark={hideRequiredMarks}
                        />
                    );
                })}
            </div>

            {typeof footerSlot === "function"
                ? footerSlot(watchedValues)
                : footerSlot}

            {renderFooter ? (
                renderFooter({ isLoading, canSubmit })
            ) : (
                <Button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    className="w-full bg-secondary-700 hover:bg-secondary-900 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <LoadingSpinner />
                            {submitLabel}...
                        </span>
                    ) : (
                        submitLabel
                    )}
                </Button>
            )}
        </form>
    );
}

// ─── Field router ─────────────────────────────────────────────────────────────

export type FormFieldProps<T extends FieldValues = FieldValues> = {
    field: FormFieldConfig;
    register: UseFormRegister<T>;
    control: Control<T>;
    getValues: () => T;
    errors: FieldErrors<T>;
    /** Leave the red asterisk off the label even if the field is required. */
    hideRequiredMark?: boolean;
};

export const FormField = <T extends FieldValues = FieldValues>({
    field,
    register,
    control,
    getValues,
    errors,
    hideRequiredMark = false,
}: FormFieldProps<T>) => {
    const error = errors[field.name as Path<T>]?.message as string | undefined;

    const wrapper = (children: React.ReactNode) => {
        if (field.type === "checkbox") {
            return (
                <div
                    className={cn(
                        "flex flex-col gap-1.5 flex-1",
                        field.className,
                    )}
                >
                    <div className="flex items-center justify-between gap-3">
                        {children}
                        {field.trailingSlot}
                    </div>
                    {error && (
                        <span className="text-[#EF4444] text-xs font-normal font-text flex items-center gap-1">
                            <ErrorIcon />
                            {error}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div
                className={cn("flex flex-col gap-1.5 flex-1", field.className)}
            >
                {field.label && (
                    <Label
                        htmlFor={field.name}
                        className="text-[#1F2937] text-sm font-medium font-text"
                    >
                        {field.label}
                        {field.validation?.required && !hideRequiredMark && (
                            <span className="text-[#EF4444] ml-1">*</span>
                        )}
                    </Label>
                )}
                {children}
                {/* File/image uploads show their description inside the drop zone */}
                {field.description && !error && field.type !== "file" && field.type !== "image" && (
                    <span className="text-[#9CA3AF] text-xs font-normal font-text">
                        {field.description}
                    </span>
                )}
                {error && (
                    <span className="text-[#EF4444] text-xs font-normal font-text flex items-center gap-1">
                        <ErrorIcon />
                        {error}
                    </span>
                )}
            </div>
        );
    };

    switch (field.type) {
        case "password":
            return wrapper(
                <PasswordInput
                    field={field}
                    register={register}
                    error={error}
                />,
            );
        case "date":
            return wrapper(
                <DateInput field={field} control={control} error={error} />,
            );
        case "datetime":
            return wrapper(
                <DateTimeInput field={field} control={control} error={error} />,
            );
        case "select":
            return wrapper(
                <SelectInput field={field} control={control} error={error} />,
            );
        case "combobox":
            return wrapper(
                <ComboboxSelectInput field={field} control={control} error={error} />,
            );
        case "multiselect":
            return wrapper(
                <MultiSelectInput field={field} control={control} error={error} />,
            );
        case "radio":
            return wrapper(
                <RadioInput field={field} control={control} error={error} />,
            );
        case "textarea":
            return wrapper(
                <TextareaInput
                    field={field}
                    register={register}
                    control={control}
                    error={error}
                />,
            );
        case "file":
        case "image":
            return wrapper(
                <FileInput
                    field={field}
                    register={register}
                    error={error}
                    getValues={getValues}
                />,
            );
        case "checkbox":
            return wrapper(
                <CheckboxInput field={field} control={control} error={error} />,
            );
        case "number-dollar":
            return wrapper(
                <DollarInput field={field} register={register} error={error} />,
            );
        case "amount":
            return wrapper(
                <AmountInput field={field} control={control} error={error} />,
            );
        default:
            return wrapper(
                <TextInput field={field} register={register} error={error} />,
            );
    }
};

// ─── Input variants ───────────────────────────────────────────────────────────

export type InputProps<T extends FieldValues = FieldValues> = {
    field: FormFieldConfig;
    register: UseFormRegister<T>;
    error?: string;
};

export type ControllerProps<T extends FieldValues = FieldValues> = {
    field: FormFieldConfig;
    control: Control<T>;
    error?: string;
    onValueChange?: (value: string) => void;
};

export const inputClass = (error?: string) =>
    cn(
        "h-11 px-3.5 border-gray-200 focus-visible:ring-secondary-700 font-text text-sm text-zinc-700 rounded-lg placeholder:text-gray-400",
        error && "border-red-500 focus-visible:ring-red-700",
    );

// SelectTrigger sizes itself with `data-[size=default]:h-8`, which outranks a
// plain `h-11` — match that selector so selects are as tall as text inputs.
const PREVIEWABLE_IMAGE_TYPE = /^image\/(jpeg|png|gif|webp|avif|svg\+xml|bmp)$/;

const selectTriggerClass = (error?: string) =>
    cn(inputClass(error), "w-full data-[size=default]:h-11");

// Text / email / tel / number
export const TextInput = <T extends FieldValues = FieldValues>({
    field,
    register,
    error,
}: InputProps<T>) => {
    const hasIcon = !!field.icon;

    return (
        <div className="relative flex items-center">
            {hasIcon && (
                <span className="absolute left-3 text-[#9CA3AF] pointer-events-none">
                    {field.icon}
                </span>
            )}
            <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                maxLength={field.maxLength}
                readOnly={field.readOnly}
                disabled={field.disabled}
                min={field.min}
                max={field.max}
                step={field.step}
                defaultValue={field.defaultValue as string}
                className={cn(
                    inputClass(error),
                    hasIcon && "pl-9",
                    field.readOnly && "bg-gray-50 cursor-default focus-visible:ring-0",
                    field.className,
                )}
                {...register(
                    field.name as Path<T>,
                    field.validation as RegisterOptions<T, Path<T>>,
                )}
            />
        </div>
    );
};

// Password — padlock leading + eye trailing
const PasswordInput = <T extends FieldValues = FieldValues>({
    field,
    register,
    error,
}: InputProps<T>) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative flex items-center">
            <Input
                id={field.name}
                type={show ? "text" : "password"}
                placeholder={field.placeholder ?? "Enter password"}
                autoComplete={field.autoComplete ?? "current-password"}
                disabled={field.disabled}
                className={cn(inputClass(error), "pr-10")}
                {...register(
                    field.name as Path<T>,
                    field.validation as RegisterOptions<T, Path<T>>,
                )}
            />
            <button
                type="button"
                onClick={() => setShow((prev) => !prev)}
                className="absolute right-3 text-[#9CA3AF] hover:text-[#6B7280] transition-colors duration-150 cursor-pointer"
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? (
                    <EyeOffIcon className="w-4 h-4" />
                ) : (
                    <EyeIcon className="w-4 h-4" />
                )}
            </button>
        </div>
    );
};

// Textarea — shows a character counter when the field's validation sets a
// minLength and/or maxLength rule (plain number or { value, message }).
const lengthRuleValue = (rule: unknown): number | undefined => {
    if (typeof rule === "number") return rule;
    if (rule && typeof rule === "object" && "value" in rule) {
        const value = Number(rule.value);
        return Number.isFinite(value) ? value : undefined;
    }
    return undefined;
};

export type TextareaInputProps<T extends FieldValues = FieldValues> =
    InputProps<T> & {
        control: Control<T>;
    };

export const TextareaInput = <T extends FieldValues = FieldValues>({
    field,
    register,
    control,
    error,
}: TextareaInputProps<T>) => {
    const value = useWatch({ control, name: field.name as Path<T> });
    const minLength = lengthRuleValue(field.validation?.minLength);
    const maxLength = lengthRuleValue(field.validation?.maxLength);
    const showCounter = minLength !== undefined || maxLength !== undefined;
    const count = typeof value === "string" ? value.length : 0;
    const isOutOfRange =
        (maxLength !== undefined && count > maxLength) ||
        (minLength !== undefined && count > 0 && count < minLength);

    return (
        <div className="flex flex-col gap-1.5">
            <Textarea
                id={field.name}
                placeholder={field.placeholder}
                disabled={field.disabled}
                rows={field.rows ?? 8}
                style={
                    field.height ? { height: `${field.height}px` } : undefined
                }
                className={cn(inputClass(error), "resize-none")}
                {...register(
                    field.name as Path<T>,
                    field.validation as RegisterOptions<T, Path<T>>,
                )}
            />
            {showCounter && (
                <div className="flex items-center justify-between gap-3 text-xs font-normal font-text text-[#9CA3AF]">
                    <span>
                        {minLength !== undefined &&
                            `Minimum ${minLength} characters`}
                    </span>
                    <span
                        aria-live="polite"
                        className={cn(
                            "tabular-nums",
                            isOutOfRange && "text-[#EF4444]",
                        )}
                    >
                        {maxLength !== undefined
                            ? `${count}/${maxLength}`
                            : count}
                    </span>
                </div>
            )}
        </div>
    );
};

// Select
export const AsyncSelectInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
    onValueChange,
}: ControllerProps<T>) => {
    // useMemo keeps the promise stable across re-renders as long as
    // field.loadOptions keeps the same reference — no effect, no setState
    const optionsPromise = useMemo(
        () => field.loadOptions!(),
        [field.loadOptions],
    );
    const options = use(optionsPromise);

    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => (
                <Select<string, false>
                    items={options}
                    onValueChange={(val) => {
                        ctrl.onChange(val);
                        onValueChange?.(val ?? "");
                    }}
                    value={ctrl.value}
                    disabled={field.disabled}
                >
                    <SelectTrigger
                        id={field.name}
                        className={selectTriggerClass(error)}
                    >
                        <SelectValue
                            placeholder={
                                field.placeholder ?? "Select an option"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        {options.map((opt) => (
                            <SelectItem
                                key={opt.value}
                                value={opt.value}
                                className="font-text text-sm"
                            >
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        />
    );
};

export const SelectInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
    onValueChange,
}: ControllerProps<T>) => {
    if (field.loadOptions) {
        return (
            <Suspense
                fallback={<Skeleton className="h-10 w-full rounded-md" />}
            >
                <AsyncSelectInput
                    field={field}
                    control={control}
                    error={error}
                    onValueChange={onValueChange}
                />
            </Suspense>
        );
    }

    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => {
                const canClear = !!field.clearable && !!ctrl.value && !field.disabled;
                return (
                    <div className="relative">
                        <Select<string, false>
                            items={field.options ?? []}
                            onValueChange={(val) => {
                                ctrl.onChange(val);
                                onValueChange?.(val ?? "");
                            }}
                            value={ctrl.value}
                            disabled={field.disabled}
                        >
                            <SelectTrigger
                                id={field.name}
                                // Room between the value and the arrow for the clear button
                                className={cn(selectTriggerClass(error), field.clearable && "gap-9")}
                            >
                                <SelectValue
                                    placeholder={
                                        field.placeholder ?? "Select an option"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                {(field.options ?? []).map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="font-text text-sm"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Beside the trigger, not in it — a button can't sit inside a button */}
                        {canClear && (
                            <button
                                type="button"
                                onClick={() => {
                                    ctrl.onChange("");
                                    onValueChange?.("");
                                }}
                                aria-label="Clear selection"
                                className="absolute top-1/2 right-9 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-gray-100 hover:text-[#4B5563] cursor-pointer"
                            >
                                <XIcon className="size-3.5" />
                            </button>
                        )}
                    </div>
                );
            }}
        />
    );
};

// Combobox — a select you can type into to filter its options, for long
// lists. The form value is the chosen option's `value`, like SelectInput.
type ComboboxControlProps<T extends FieldValues = FieldValues> =
    ControllerProps<T> & { options: SelectOption[] };

const ComboboxControl = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
    options,
}: ComboboxControlProps<T>) => (
    <Controller
        name={field.name as Path<T>}
        control={control}
        defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
        rules={field.validation as RegisterOptions<T, Path<T>>}
        render={({ field: ctrl }) => (
            <Combobox<SelectOption>
                items={options}
                value={options.find((opt) => opt.value === ctrl.value) ?? null}
                onValueChange={(opt) => ctrl.onChange(opt?.value ?? "")}
                isItemEqualToValue={(item, value) => item.value === value.value}
                disabled={field.disabled}
                autoHighlight
            >
                <ComboboxInput
                    id={field.name}
                    ref={ctrl.ref}
                    onBlur={ctrl.onBlur}
                    placeholder={field.placeholder ?? "Search"}
                    aria-invalid={!!error}
                    className={inputClass(error)}
                />
                <ComboboxContent>
                    <ComboboxEmpty>
                        {field.emptyMessage ?? "No results found"}
                    </ComboboxEmpty>
                    <ComboboxList>
                        {(opt: SelectOption) => (
                            <ComboboxItem
                                key={opt.value}
                                value={opt}
                                className="font-text"
                            >
                                {opt.label}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        )}
    />
);

const AsyncComboboxSelectInput = <T extends FieldValues = FieldValues>(
    props: ControllerProps<T>,
) => {
    const { loadOptions } = props.field;
    const optionsPromise = useMemo(() => loadOptions!(), [loadOptions]);
    return <ComboboxControl {...props} options={use(optionsPromise)} />;
};

export const ComboboxSelectInput = <T extends FieldValues = FieldValues>(
    props: ControllerProps<T>,
) => {
    if (props.field.loadOptions) {
        return (
            <Suspense fallback={<Skeleton className="h-11 w-full rounded-lg" />}>
                <AsyncComboboxSelectInput {...props} />
            </Suspense>
        );
    }
    return <ComboboxControl {...props} options={props.field.options ?? []} />;
};

// Multi-select — caps selections at field.maxSelections and shows a
// comma-joined summary of the chosen labels in the trigger.
export const MultiSelectInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
}: ControllerProps<T>) => {
    const options = field.options ?? [];

    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={([] as string[]) as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => {
                const selected: string[] = Array.isArray(ctrl.value)
                    ? ctrl.value
                    : [];
                const atMax = !!field.maxSelections && selected.length >= field.maxSelections;
                const selectedLabels = options
                    .filter((opt) => selected.includes(opt.value))
                    .map((opt) => opt.label);

                return (
                    <Select<string, true>
                        items={options}
                        multiple
                        value={selected}
                        onValueChange={(val) => ctrl.onChange(val)}
                        disabled={field.disabled}
                    >
                        <SelectTrigger
                            id={field.name}
                            className={selectTriggerClass(error)}
                        >
                            <span
                                className={cn(
                                    "truncate text-left",
                                    selectedLabels.length === 0 &&
                                        "text-gray-400",
                                )}
                            >
                                {selectedLabels.length > 0
                                    ? selectedLabels.join(", ")
                                    : (field.placeholder ?? "Select options")}
                            </span>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            {options.map((opt) => {
                                const isSelected = selected.includes(opt.value);
                                return (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        disabled={atMax && !isSelected}
                                        className="font-text text-sm"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                );
            }}
        />
    );
};

// Radio group — a small set of mutually exclusive options rendered inline.
export const RadioInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
}: ControllerProps<T>) => {
    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => (
                <RadioGroup
                    aria-invalid={!!error}
                    disabled={field.disabled}
                    value={ctrl.value}
                    onValueChange={(value) => ctrl.onChange(value)}
                >
                    {(field.options ?? []).map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 text-sm font-normal font-text text-[#1F2937] cursor-pointer select-none"
                        >
                            <RadioGroupItem
                                value={opt.value}
                                className={cn(
                                    error && "border-[#EF4444]",
                                )}
                            />
                            {opt.label}
                        </label>
                    ))}
                </RadioGroup>
            )}
        />
    );
};

// Date picker
export const DateInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
}: ControllerProps<T>) => {
    const minDate = field.minDate ? new Date(field.minDate) : undefined;
    // Controlled so picking a day closes it, instead of leaving the calendar
    // over whatever's below
    const [isOpen, setIsOpen] = useState(false);

    const isDateDisabled = (date: Date) => {
        if (field.disabled) return true;
        if (field.isDateDisabled && field.isDateDisabled(date)) return true;
        if (minDate)
            return date < new Date(new Date(minDate).setHours(0, 0, 0, 0));
        return false;
    };

    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger
                        render={
                            <Button
                                id={field.name}
                                variant="outline"
                                disabled={field.disabled}
                                className={cn(
                                    inputClass(error),
                                    "w-full justify-start text-left font-normal",
                                    !ctrl.value && "text-[#9CA3AF]",
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-[#9CA3AF]" />
                                {ctrl.value
                                    ? dayjs(ctrl.value).format(
                                          "MMMM D, YYYY",
                                      )
                                    : (field.placeholder ?? "Pick a date")}
                            </Button>
                        }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            startMonth={new Date(1950, 0)}
                            endMonth={
                                new Date(new Date().getFullYear() + 20, 11)
                            }
                            selected={
                                ctrl.value ? new Date(ctrl.value) : undefined
                            }
                            onSelect={(date: Date | undefined) => {
                                ctrl.onChange(date?.toISOString() ?? "");
                                if (date) setIsOpen(false);
                            }}
                            disabled={isDateDisabled}
                            autoFocus
                        />
                    </PopoverContent>
                </Popover>
            )}
        />
    );
};

// DateTime picker
export const DateTimeInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
}: ControllerProps<T>) => {
    const minDate = field.minDate ? new Date(field.minDate) : undefined;
    const [step, setStep] = useState<"date" | "time">("date");
    const [open, setOpen] = useState(false);

    const isDateDisabled = (date: Date) => {
        if (field.disabled) return true;
        if (field.isDateDisabled && field.isDateDisabled(date)) return true;
        if (minDate)
            return date < new Date(new Date(minDate).setHours(0, 0, 0, 0));
        return false;
    };

    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => {
                const parsed = ctrl.value ? new Date(ctrl.value) : undefined;

                const handleDateChange = (date?: Date) => {
                    if (!date) return;
                    const existing = ctrl.value
                        ? new Date(ctrl.value)
                        : new Date();
                    date.setHours(existing.getHours(), existing.getMinutes());
                    ctrl.onChange(date.toISOString());
                };

                // Derive current hour/minute/period from stored value
                const hour24 = parsed ? parsed.getHours() : 12;
                const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
                const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
                const minute = parsed ? parsed.getMinutes() : 0;

                const applyTime = (h12: number, m: number, p: "AM" | "PM") => {
                    const base = ctrl.value ? new Date(ctrl.value) : new Date();
                    let h24 = h12 % 12;
                    if (p === "PM") h24 += 12;
                    base.setHours(h24, m);
                    ctrl.onChange(base.toISOString());
                };

                const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
                const minuteOptions = Array.from(
                    { length: 59 },
                    (_, i) => i + 1,
                );

                return (
                    <Popover
                        open={open}
                        onOpenChange={(o) => {
                            setOpen(o);
                            if (o) setStep("date");
                        }}
                    >
                        <PopoverTrigger
                            render={
                                <Button
                                    id={field.name}
                                    variant="outline"
                                    disabled={field.disabled}
                                    className={cn(
                                        inputClass(error),
                                        "w-full justify-start text-left font-normal",
                                        !ctrl.value && "text-[#9CA3AF]",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-[#9CA3AF] shrink-0" />
                                    {parsed
                                        ? `${dayjs(parsed).format("MMM D, YYYY")} at ${dayjs(parsed).format("h:mm A")}`
                                        : (field.placeholder ??
                                          "Pick date & time")}
                                </Button>
                            }
                        />

                        <PopoverContent className="w-auto p-0" align="start">
                            {step === "date" ? (
                                <>
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        startMonth={new Date(1950, 0)}
                                        endMonth={
                                            new Date(
                                                new Date().getFullYear() + 20,
                                                11,
                                            )
                                        }
                                        selected={parsed}
                                        onSelect={handleDateChange}
                                        disabled={isDateDisabled}
                                        autoFocus
                                    />
                                    <div className="border-t border-[#E5E7EB] p-3">
                                        <Button
                                            type="button"
                                            disabled={!ctrl.value}
                                            onClick={() => setStep("time")}
                                            className="w-full bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            Next: pick a time
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 flex flex-col gap-3 w-65">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-800 text-xs font-semibold font-text uppercase">
                                            Pick a time
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setStep("date")}
                                            className="text-xs font-text text-secondary-700 hover:underline cursor-pointer"
                                        >
                                            Back to date
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-end gap-2">
                                            {/* Hour */}
                                            <div className="flex flex-col gap-1 flex-1">
                                                <label className="text-[10px] text-[#9CA3AF] font-text uppercase">
                                                    Hour
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={12}
                                                    list={`${field.name}-hour-list`}
                                                    value={hour12}
                                                    onChange={(e) => {
                                                        const raw = parseInt(
                                                            e.target.value,
                                                            10,
                                                        );
                                                        if (Number.isNaN(raw))
                                                            return;
                                                        applyTime(
                                                            Math.min(
                                                                12,
                                                                Math.max(
                                                                    1,
                                                                    raw,
                                                                ),
                                                            ),
                                                            minute,
                                                            period,
                                                        );
                                                    }}
                                                    className="w-full border border-[#E5E7EB] rounded-md px-2 py-2 text-sm font-text text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-secondary-700 focus:border-transparent"
                                                />
                                                <datalist
                                                    id={`${field.name}-hour-list`}
                                                >
                                                    {hourOptions.map((h) => (
                                                        <option
                                                            key={h}
                                                            value={h}
                                                        />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <span className="text-lg font-text text-[#6B7280] pb-2">
                                                :
                                            </span>

                                            {/* Minute */}
                                            <div className="flex flex-col gap-1 flex-1">
                                                <label className="text-[10px] text-[#9CA3AF] font-text uppercase">
                                                    Minute
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={59}
                                                    list={`${field.name}-minute-list`}
                                                    value={minute}
                                                    onChange={(e) => {
                                                        const raw = parseInt(
                                                            e.target.value,
                                                            10,
                                                        );
                                                        if (Number.isNaN(raw))
                                                            return;
                                                        applyTime(
                                                            hour12,
                                                            Math.min(
                                                                59,
                                                                Math.max(
                                                                    0,
                                                                    raw,
                                                                ),
                                                            ),
                                                            period,
                                                        );
                                                    }}
                                                    className="w-full border border-[#E5E7EB] rounded-md px-2 py-2 text-sm font-text text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-secondary-700 focus:border-transparent"
                                                />
                                                <datalist
                                                    id={`${field.name}-minute-list`}
                                                >
                                                    {minuteOptions.map((m) => (
                                                        <option
                                                            key={m}
                                                            value={m}
                                                        />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>

                                        {/* AM / PM toggle */}
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] text-[#9CA3AF] font-text uppercase">
                                                &nbsp;
                                            </span>
                                            <div className="flex justify-center border border-[#E5E7EB] rounded-md overflow-hidden">
                                                {(["AM", "PM"] as const).map(
                                                    (p) => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() =>
                                                                applyTime(
                                                                    hour12,
                                                                    minute,
                                                                    p,
                                                                )
                                                            }
                                                            className={cn(
                                                                "px-3 py-2 text-xs font-semibold font-text cursor-pointer transition-colors",
                                                                period === p
                                                                    ? "bg-secondary-700 text-white"
                                                                    : "bg-white text-[#6B7280] hover:bg-[#F9FAFB]",
                                                            )}
                                                        >
                                                            {p}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="w-full bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer transition-colors duration-300 mt-2"
                                    >
                                        Done
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                );
            }}
        />
    );
};

// File / Image upload
export type FileInputProps<T extends FieldValues = FieldValues> =
    InputProps<T> & {
        control?: Control<T>;
        getValues?: () => T;
    };

export const FileInput = <T extends FieldValues = FieldValues>({
    field,
    register,
    error,
    getValues,
}: FileInputProps<T>) => {
    const formContext = useFormContext<T>();
    const getValueFn = getValues ?? formContext?.getValues;

    const getInitialFiles = (): File[] => {
        if (!getValueFn) return [];
        try {
            const val = getValueFn()[field.name as Path<T>] as unknown;
            if (!val) return [];
            if (typeof FileList !== "undefined" && val instanceof FileList) {
                return Array.from(val);
            }
            if (Array.isArray(val)) {
                return val.filter(
                    (f: unknown): f is File =>
                        typeof File !== "undefined" && f instanceof File,
                );
            }
            if (typeof File !== "undefined" && val instanceof File) {
                return [val];
            }
        } catch {
            // ignore
        }
        return [];
    };

    const [files, setFiles] = useState<File[]>(getInitialFiles);
    const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { ref, ...rest } = register(
        field.name as Path<T>,
        field.validation as RegisterOptions<T, Path<T>>,
    );

    const defaultIcon =
        field.type === "image" ? (
            <ImageIcon className="size-5 text-[#9CA3AF]" />
        ) : (
            <UploadIcon className="size-5 text-[#9CA3AF]" />
        );

    const icon = field.uploadIcon ?? defaultIcon;

    // Two files are treated as "the same" if name, size and lastModified all match —
    // avoids accidental duplicates if a user reselects the same file twice.
    const isSameFile = (a: File, b: File) =>
        a.name === b.name &&
        a.size === b.size &&
        a.lastModified === b.lastModified;

    const getFileKey = (file: File) =>
        `${file.name}-${file.size}-${file.lastModified}`;

    const validateFile = (file: File): string | null => {
        const maxSizeMB = field.maxSizeMB ?? 5;
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `Exceeds ${maxSizeMB}MB limit (${sizeMB.toFixed(1)}MB)`;
        }

        const acceptStr =
            field.accept ?? (field.type === "image" ? "image/*" : undefined);
        if (acceptStr) {
            const tokens = acceptStr
                .split(",")
                .map((t) => t.trim().toLowerCase());
            const fileMime = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();

            const matches = tokens.some((token) => {
                if (token.startsWith(".")) {
                    return fileName.endsWith(token);
                }
                if (token.endsWith("/*")) {
                    const prefix = token.slice(0, -2);
                    return fileMime.startsWith(prefix);
                }
                return fileMime === token;
            });

            if (!matches) {
                return `Unsupported format (${file.type || "file"})`;
            }
        }

        return null;
    };

    const syncInputFiles = (updated: File[]) => {
        if (!inputRef.current) return;

        const dt = new DataTransfer();
        updated.forEach((file) => dt.items.add(file));
        inputRef.current.files = dt.files;

        rest.onChange({ target: inputRef.current } as unknown as Event);
    };

    const handleFilesSelected = (newlySelected: File[]) => {
        if (!newlySelected.length) return;

        const newErrors: Record<string, string> = {};

        newlySelected.forEach((file) => {
            const err = validateFile(file);
            if (err) {
                newErrors[getFileKey(file)] = err;
            }
        });

        let combined = field.multiple
            ? [
                  ...files,
                  ...newlySelected.filter(
                      (nf) =>
                          !files.some((existing) => isSameFile(existing, nf)),
                  ),
              ]
            : newlySelected;

        if (field.maxFiles) {
            combined = combined.slice(0, field.maxFiles);
        }

        setFileErrors((prev) => ({ ...prev, ...newErrors }));
        setFiles(combined);

        const validFiles = combined.filter((f) => {
            const key = getFileKey(f);
            return !newErrors[key] && !fileErrors[key];
        });
        syncInputFiles(validFiles);
    };

    const removeFile = (index: number) => {
        const fileToRemove = files[index];
        const nextErrors = { ...fileErrors };
        if (fileToRemove) {
            const key = getFileKey(fileToRemove);
            delete nextErrors[key];
            setFileErrors(nextErrors);
        }

        const updated = files.filter((_, i) => i !== index);
        setFiles(updated);

        const validFiles = updated.filter((f) => {
            const key = getFileKey(f);
            return !nextErrors[key];
        });
        syncInputFiles(validFiles);
    };

    const hasFileErrors = Object.keys(fileErrors).length > 0;
    const activeError = hasFileErrors
        ? "Some uploaded files have errors. Please remove the highlighted files below."
        : error;

    return (
        <div className="flex flex-col gap-3">
            <label
                htmlFor={field.name}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (
                        e.dataTransfer.files &&
                        e.dataTransfer.files.length > 0
                    ) {
                        handleFilesSelected(Array.from(e.dataTransfer.files));
                    }
                }}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-5 cursor-pointer transition-colors duration-200 group",
                    isDragging && "border-secondary-700 bg-secondary-50/50",
                    activeError
                        ? "border-[#EF4444] bg-[#FFF5F5]"
                        : "border-[#E5E7EB] hover:border-secondary-700",
                )}
            >
                {icon}

                <div className="text-center">
                    <span
                        className={cn(
                            "text-sm font-medium font-text",
                            activeError
                                ? "text-[#EF4444]"
                                : "text-secondary-700 group-hover:underline",
                        )}
                    >
                        Click to upload
                    </span>

                    <span className="text-[#6B7280] text-sm font-text">
                        {" "}
                        or drag and drop
                    </span>
                </div>

                {field.description && (
                    <span className="text-[#9CA3AF] text-xs font-text text-center">
                        {field.description}
                    </span>
                )}

                {field.maxFiles && (
                    <span className="text-[#6B7280] text-xs font-text">
                        {files.length}/{field.maxFiles} selected
                    </span>
                )}

                <input
                    id={field.name}
                    type="file"
                    accept={field.accept}
                    capture={field.capture}
                    multiple={field.multiple}
                    disabled={field.disabled}
                    className="hidden"
                    {...rest}
                    ref={(e) => {
                        ref(e);
                        if (
                            e &&
                            files.length > 0 &&
                            (!e.files || e.files.length === 0)
                        ) {
                            try {
                                const dt = new DataTransfer();
                                files.forEach((file) => dt.items.add(file));
                                e.files = dt.files;
                            } catch {
                                // ignore if environment blocks manual files assignment
                            }
                        }
                        inputRef.current = e;
                    }}
                    onChange={(e) => {
                        const newlySelected = Array.from(e.target.files ?? []);
                        handleFilesSelected(newlySelected);
                    }}
                />
            </label>

            {activeError && (
                <span className="text-[#EF4444] text-xs font-normal font-text flex items-center gap-1">
                    <ErrorIcon />
                    {activeError}
                </span>
            )}

            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((file, index) => {
                        const fileKey = getFileKey(file);
                        const fileErr = fileErrors[fileKey];
                        // Only formats browsers can draw get a thumbnail — HEIC, say, shows the icon
                        const isImage = PREVIEWABLE_IMAGE_TYPE.test(file.type);
                        const preview = isImage
                            ? URL.createObjectURL(file)
                            : null;

                        return (
                            <div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                className={cn(
                                    "relative rounded-lg border overflow-hidden bg-white transition-all duration-200 flex flex-col justify-between",
                                    fileErr
                                        ? "border-red-500 ring-2 ring-red-500 bg-[#FFF5F5]"
                                        : "border-gray-300",
                                )}
                            >
                                {isImage && field.showPreview !== false ? (
                                    <div className="relative w-full aspect-square bg-gray-100">
                                        <Image
                                            src={preview!}
                                            alt={file.name}
                                            title={file.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-28 bg-zinc-200">
                                        {icon}
                                    </div>
                                )}

                                <div className="p-2">
                                    <p
                                        className={cn(
                                            "text-xs font-text truncate",
                                            fileErr
                                                ? "text-[#EF4444] font-semibold"
                                                : "text-[#1F2937]",
                                        )}
                                    >
                                        {file.name}
                                    </p>

                                    <p className="text-[11px] text-[#9CA3AF]">
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB
                                    </p>

                                    {fileErr && (
                                        <p className="text-[11px] text-[#EF4444] font-medium font-text mt-1 flex items-center gap-1">
                                            <ErrorIcon />
                                            <span
                                                className="truncate"
                                                title={fileErr}
                                            >
                                                {fileErr}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className={cn(
                                        "absolute top-2 right-2 w-6 h-6 rounded-full shadow flex items-center justify-center transition-colors",
                                        fileErr
                                            ? "bg-[#EF4444] text-white hover:bg-red-700"
                                            : "bg-white text-red-500 hover:bg-red-50",
                                    )}
                                    title="Remove file"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Checkbox
export type CheckboxInputProps<T extends FieldValues = FieldValues> =
    ControllerProps<T> & {
        /** Override the checked state with a derived value instead of the raw field value. */
        checked?: boolean;
        /** Override the change handler — e.g. to guard against re-checking, or to sync a related field. */
        onCheckedChange?: (checked: boolean) => void;
    };

export const CheckboxInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
    checked,
    onCheckedChange,
}: CheckboxInputProps<T>) => {
    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={
                (field.defaultValue ?? false) as PathValue<T, Path<T>>
            }
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => (
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={field.name}
                        disabled={field.disabled}
                        checked={checked ?? !!ctrl.value}
                        onCheckedChange={(value: boolean | "indeterminate") =>
                            onCheckedChange
                                ? onCheckedChange(!!value)
                                : ctrl.onChange(value)
                        }
                        className={cn(
                            "border-[#E5E7EB] data-[state=checked]:bg-secondary-700 data-[state=checked]:border-secondary-700",
                            error && "border-[#EF4444]",
                            field.disabled && "opacity-50 cursor-not-allowed",
                        )}
                    />
                    {field.label && (
                        <label
                            htmlFor={field.name}
                            className={cn(
                                "text-sm font-normal font-text leading-5 cursor-pointer select-none",
                                field.disabled
                                    ? "text-[#9CA3AF] cursor-not-allowed"
                                    : "text-[#6B7280]",
                            )}
                        >
                            {field.label}
                        </label>
                    )}
                </div>
            )}
        />
    );
};

// Money/Price Input
export const DollarInput = <T extends FieldValues = FieldValues>({
    field,
    register,
    error,
}: InputProps<T>) => (
    <div className="relative flex items-center">
        <span className="absolute left-3 text-[#6B7280] text-sm font-medium pointer-events-none select-none">
            $
        </span>
        <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder}
            disabled={field.disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            className={cn(inputClass(error), "pl-7")}
            {...register(
                field.name as Path<T>,
                field.validation as RegisterOptions<T, Path<T>>,
            )}
        />
    </div>
);

// Amount — whole units only, shown with the currency symbol and thousands
// separators as you type ("₦300,000"). The form value is the plain digit
// string ("300000"), or "" when empty.
const MAX_AMOUNT_DIGITS = 12;

export const AmountInput = <T extends FieldValues = FieldValues>({
    field,
    control,
    error,
}: ControllerProps<T>) => {
    const symbol = field.currencySymbol ?? DEFAULT_CURRENCY;

    return (
        <Controller
            name={field.name as Path<T>}
            control={control}
            defaultValue={(field.defaultValue ?? "") as PathValue<T, Path<T>>}
            rules={field.validation as RegisterOptions<T, Path<T>>}
            render={({ field: ctrl }) => {
                const digits = String(ctrl.value ?? "");
                return (
                    <Input
                        id={field.name}
                        ref={ctrl.ref}
                        name={ctrl.name}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        value={
                            digits
                                ? `${symbol}${Number(digits).toLocaleString("en-NG")}`
                                : ""
                        }
                        onChange={(e) =>
                            ctrl.onChange(
                                e.target.value
                                    .replace(/\D/g, "")
                                    .replace(/^0+(?=\d)/, "")
                                    .slice(0, MAX_AMOUNT_DIGITS),
                            )
                        }
                        onBlur={ctrl.onBlur}
                        className={inputClass(error)}
                    />
                );
            }}
        />
    );
};

export const ErrorIcon = () => (
    <TriangleAlert className="size-3 text-[#EF4444]" strokeWidth={2} />
);

export const LoadingSpinner = () => (
    <Loader2 className="animate-spin w-4 h-4" />
);