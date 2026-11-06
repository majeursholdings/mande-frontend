"use client";

import { useState } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { ImagePlus, Trash2, X } from "lucide-react";
import { FormField, inputClass } from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { API_PHOTO_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import Notice from "@/components/manufacturerPlatform/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SHOP_LIMITS } from "@/constant/shop";
import type { ProductOption, ProductVariantPayload, SellerProduct } from "@/lib/services/shopService";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The Variants part of the ProductForm: a product that comes in options
// (Color: Red, Blue; Size: Single, Double...) has a variant for each
// combination of their values, each with its own price, stock or lead time,
// code and photos. The seller adds the options and their values; the rows
// follow from them, and a row switched off is a combination they don't sell.
//
// Changing the options works the rows out again. A combination that's still
// there keeps its row (matched by its values, ignoring case); a new one starts
// from the row it grew out of (adding an option) or shrank to (taking one
// away), else from the product's own price.
//
// Each row's fields are flat, named after a key that stays with the
// combination (vPrice_<key>, not variants.<i>.price), like the delivery zone
// fields: the shared FormField shows the error for a top-level name only, and
// a key survives the rows moving about.
// ─────────────────────────────────────────────────────────────────────────────

type Photo = { publicId: string; url: string };

/** An option as it's edited: `key` stays with it while its name changes. */
export type OptionDraft = { key: string; name: string; values: string[] };

/** One combination: the key of its fields, and its values in the options' order. */
export type VariantRow = { key: string; values: string[] };

type VariantFieldPrefix = "vPrice" | "vMade" | "vStock" | "vLead" | "vSku" | "vPhotos" | "vOn";

export type VariantValues = {
    variantsOn: boolean;
    options: OptionDraft[];
    variantRows: VariantRow[];
    // Per row: vPrice_<key> (naira digits), vMade_<key> (made to order), vStock_<key>,
    // vLead_<key>, vSku_<key>, vPhotos_<key>, vOn_<key> (on sale)
    [variantField: `${VariantFieldPrefix}_${string}`]: string | boolean | Photo[];
};

/** Where a new row starts when there's no row to take after: the product's own price and availability. */
export type RowSeed = { price: string; madeToOrder: boolean; leadTimeDays: string };

const nairaOf = (kobo: number) => String(Math.round(kobo / 100));
const koboOf = (naira: string) => Math.round(Number(naira || 0) * 100);
const textOf = (value: unknown) => (typeof value === "string" ? value : "");
const photosOf = (value: unknown) => (Array.isArray(value) ? (value as Photo[]) : []);
const fieldName = (prefix: VariantFieldPrefix, key: string) => `${prefix}_${key}` as const;

/** A whole number from min to max, or null. */
function wholeOrNull(value: string, min: number, max: number): number | null {
    const number = Number(value);
    return value.trim() !== "" && Number.isInteger(number) && number >= min && number <= max ? number : null;
}

const wholeNumber = (min: number, max: number, label: string) => (value: string) =>
    wholeOrNull(value, min, max) !== null || `Enter ${label} from ${min} to ${max.toLocaleString("en-GB")}`;

const comboKey = (values: string[]) => values.map((value) => value.trim().toLowerCase()).join("\u0000");
const sameWord = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
/** Every value of `part` is in `whole`. */
const holds = (whole: string[], part: string[]) => part.every((value) => whole.some((each) => sameWord(each, value)));

/** Every combination of the options' values, in the options' order. Options without values yet are left out. */
function combinations(options: { values: string[] }[]): string[][] {
    const usable = options.filter((option) => option.values.length > 0);
    if (usable.length === 0) return [];
    return usable.reduce<string[][]>((combos, option) => combos.flatMap((combo) => option.values.map((value) => [...combo, value])), [[]]);
}

const countCombinations = (options: { values: string[] }[]) => {
    const usable = options.filter((option) => option.values.length > 0);
    return usable.length === 0 ? 0 : usable.reduce((count, option) => count * option.values.length, 1);
};

const newKey = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

/** The form's starting values for a product's options and variants. */
export function variantValuesOf(product: SellerProduct | undefined): VariantValues {
    const options = product?.options ?? [];
    const saved = new Map((product?.variants ?? []).map((variant) => [comboKey(variant.values), variant]));
    const values: VariantValues = {
        variantsOn: options.length > 0,
        options: options.map((option, index) => ({ key: `o${index}`, name: option.name, values: [...option.values] })),
        variantRows: [],
    };
    values.variantRows = combinations(options).map((combo, index) => {
        const variant = saved.get(comboKey(combo));
        const key = variant ? `v${variant.id}` : `n${index}`;
        values[fieldName("vPrice", key)] = variant ? nairaOf(variant.priceKobo) : "";
        values[fieldName("vMade", key)] = variant ? variant.stock === null : false;
        values[fieldName("vStock", key)] = variant?.stock != null ? String(variant.stock) : "";
        values[fieldName("vLead", key)] = variant?.leadTimeDays != null ? String(variant.leadTimeDays) : "";
        values[fieldName("vSku", key)] = variant?.sku ?? "";
        values[fieldName("vPhotos", key)] = (variant?.images ?? []).flatMap((image) => (image.url ? [{ publicId: image.publicId, url: image.url }] : []));
        // A combination the product doesn't have is one the seller doesn't sell
        values[fieldName("vOn", key)] = variant ? variant.active : false;
        return { key, values: variant ? [...variant.values] : combo };
    });
    return values;
}

/**
 * The options and variants to send, and the row each variant sent came from
 * (so the API's `variants.<i>...` errors can go on it). A row switched off
 * before it had a price isn't sent: that combination simply isn't sold.
 */
export function variantsPayload(values: VariantValues): { options: ProductOption[]; variants: ProductVariantPayload[]; rowKeys: string[] } {
    const variants: ProductVariantPayload[] = [];
    const rowKeys: string[] = [];
    for (const row of values.variantRows) {
        const on = values[fieldName("vOn", row.key)] === true;
        const price = textOf(values[fieldName("vPrice", row.key)]);
        if (!on && !(Number(price) >= 1)) continue;
        const madeToOrder = values[fieldName("vMade", row.key)] === true;
        variants.push({
            values: row.values,
            priceKobo: koboOf(price),
            // Checked for a row on sale; one that's off sends what makes sense of it
            stock: madeToOrder ? null : (wholeOrNull(textOf(values[fieldName("vStock", row.key)]), 0, SHOP_LIMITS.maxStock) ?? 0),
            leadTimeDays: madeToOrder ? wholeOrNull(textOf(values[fieldName("vLead", row.key)]), 1, SHOP_LIMITS.maxLeadTimeDays) : null,
            sku: textOf(values[fieldName("vSku", row.key)]).trim(),
            images: photosOf(values[fieldName("vPhotos", row.key)]).map((photo) => ({ publicId: photo.publicId })),
            active: on,
        });
        rowKeys.push(row.key);
    }
    return { options: values.options.map((option) => ({ name: option.name.trim(), values: option.values })), variants, rowKeys };
}

const ERROR_FIELDS: Record<string, VariantFieldPrefix> = { priceKobo: "vPrice", stock: "vStock", leadTimeDays: "vLead", sku: "vSku", images: "vPhotos" };

/**
 * Where an API error on `options...` or `variants...` shows in the form: the
 * row's field when it's on screen, else the rows' own message (with the row's
 * name). `rowKeys` are the rows in the order they were sent.
 */
export function variantErrorTarget(path: string, message: string, values: VariantValues, rowKeys: string[]): { name: string; message: string } {
    if (path === "options" || path.startsWith("options.")) return { name: "options", message };
    const match = /^variants\.(\d+)\.(\w+)/.exec(path);
    const row = match ? values.variantRows.find((each) => each.key === rowKeys[Number(match[1])]) : undefined;
    if (!match || !row) return { name: "variantRows", message };
    const prefix = ERROR_FIELDS[match[2]];
    const madeToOrder = values[fieldName("vMade", row.key)] === true;
    const shown =
        prefix !== undefined &&
        values[fieldName("vOn", row.key)] === true &&
        !(prefix === "vStock" && madeToOrder) &&
        !(prefix === "vLead" && !madeToOrder);
    return shown ? { name: fieldName(prefix, row.key), message } : { name: "variantRows", message: `${row.values.join(" / ")}: ${message}` };
}

/** What's wrong with the options, for their message; null when they're fine. */
function optionsProblem(options: OptionDraft[]): string | null {
    if (options.length === 0) return "Add an option, e.g. Color";
    if (options.some((option) => option.name.trim() === "")) return "Name every option, e.g. Color or Size";
    const empty = options.find((option) => option.values.length === 0);
    if (empty) return `Add at least one value to ${empty.name.trim()}`;
    const names = options.map((option) => option.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return "Give each option its own name";
    return null;
}

const LABEL_CLASS = "text-[#1F2937] text-sm font-medium font-text";
const HINT_CLASS = "text-[#9CA3AF] text-xs font-normal font-text";
const ERROR_CLASS = "text-[#EF4444] text-xs font-normal font-text";
const LINK_BUTTON_CLASS = "text-sm font-medium font-text text-secondary-700 hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline";

/** The Variants switch, and the options and rows while it's on. `seed` is read when a row is added. */
export default function VariantsSection({ seed, hadVariants }: { seed: () => RowSeed; hadVariants: boolean }) {
    const { control, getValues, setValue } = useFormContext<VariantValues>();
    const on = useWatch({ control, name: "variantsOn" });

    const toggle = (next: boolean) => {
        setValue("variantsOn", next, { shouldDirty: true });
        // Start with one option to fill in
        if (next && getValues("options").length === 0) setValue("options", [{ key: newKey("o"), name: "", values: [] }], { shouldDirty: true });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <span className={LABEL_CLASS}>Variants</span>
                    <span className={HINT_CLASS}>For a product in more than one colour, size or material, each with its own price and stock.</span>
                </div>
                <Switch checked={on} onCheckedChange={toggle} aria-label="Sell it in variants" />
            </div>
            {on ? (
                <VariantsEditor seed={seed} />
            ) : (
                hadVariants && <Notice tone="warning">Saving takes the variants off. The price and stock below apply to the product again.</Notice>
            )}
        </div>
    );
}

function VariantsEditor({ seed }: { seed: () => RowSeed }) {
    const { control, getValues, setValue, clearErrors } = useFormContext<VariantValues>();
    // Registered here, so they're checked on submit while variants are on
    const {
        field: { value: options, onChange: setOptions },
        fieldState: { error: optionsError },
    } = useController({
        control,
        name: "options",
        rules: { validate: (value: OptionDraft[]) => optionsProblem(value) ?? true },
    });
    const {
        field: { value: rows },
        fieldState: { error: rowsError },
    } = useController({
        control,
        name: "variantRows",
        rules: {
            validate: (value: VariantRow[], values: VariantValues) =>
                value.some((row) => values[fieldName("vOn", row.key)] === true) || "Put at least one variant on sale",
        },
    });
    const watchedOn = useWatch({ control, name: rows.map((row) => fieldName("vOn", row.key)) });
    const onSale = watchedOn.filter((value) => value === true).length;

    /** Puts the new options in place and works the rows out again. Returns why it can't, or null. */
    const applyOptions = (next: OptionDraft[]): string | null => {
        const count = countCombinations(next);
        if (count > SHOP_LIMITS.maxVariants) return `That makes ${count} variants. The most is ${SHOP_LIMITS.maxVariants}.`;
        const current = getValues();
        const before = current.variantRows;
        const byCombo = new Map(before.map((row) => [comboKey(row.values), row]));
        const start = seed();
        const nextRows = combinations(next).map((combo): VariantRow => {
            const same = byCombo.get(comboKey(combo));
            if (same) return { key: same.key, values: combo };
            const key = newKey("n");
            // An option added or taken away: start from the row it grew out of or shrank to
            const parent = before.find((row) => holds(combo, row.values) || holds(row.values, combo));
            const from = (prefix: VariantFieldPrefix) => (parent ? current[fieldName(prefix, parent.key)] : undefined);
            setValue(fieldName("vPrice", key), parent ? textOf(from("vPrice")) : start.price);
            setValue(fieldName("vMade", key), parent ? from("vMade") === true : start.madeToOrder);
            setValue(fieldName("vStock", key), "");
            setValue(fieldName("vLead", key), parent ? textOf(from("vLead")) : start.leadTimeDays);
            setValue(fieldName("vSku", key), "");
            setValue(fieldName("vPhotos", key), []);
            setValue(fieldName("vOn", key), parent ? from("vOn") === true : true);
            return { key, values: combo };
        });
        setOptions(next);
        setValue("variantRows", nextRows, { shouldDirty: true });
        clearErrors(["options", "variantRows"]);
        return null;
    };

    const updateOption = (key: string, change: Partial<OptionDraft>) => options.map((option) => (option.key === key ? { ...option, ...change } : option));

    return (
        <div className="flex flex-col gap-4 rounded-lg border border-border p-3 sm:p-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <span className={LABEL_CLASS}>Options</span>
                    <span className={HINT_CLASS}>
                        Up to {SHOP_LIMITS.maxOptions}, like Color or Size, each with the values customers choose from. Every combination becomes a variant.
                    </span>
                </div>
                {options.map((option, index) => (
                    <OptionEditor
                        key={option.key}
                        option={option}
                        placeholder={["e.g. Color", "e.g. Size", "e.g. Material"][index] ?? "e.g. Finish"}
                        onRename={(name) => {
                            setOptions(updateOption(option.key, { name }));
                            clearErrors("options");
                        }}
                        onValues={(values) => applyOptions(updateOption(option.key, { values }))}
                        onRemove={() => applyOptions(options.filter((each) => each.key !== option.key))}
                        canRemove={options.length > 1}
                    />
                ))}
                {optionsError?.message && <span className={ERROR_CLASS}>{optionsError.message}</span>}
                {options.length < SHOP_LIMITS.maxOptions && (
                    <button
                        type="button"
                        className={cn(LINK_BUTTON_CLASS, "self-start")}
                        onClick={() => {
                            setOptions([...options, { key: newKey("o"), name: "", values: [] }]);
                            clearErrors("options");
                        }}
                    >
                        Add another option
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <span className={LABEL_CLASS}>Variants</span>
                    <span className={HINT_CLASS}>
                        {rows.length === 0
                            ? "Add values to the options to see the variants."
                            : `${rows.length} ${rows.length === 1 ? "variant" : "variants"}, ${onSale} on sale. Switch off any you don't sell.`}
                    </span>
                </div>
                {rows.length > 1 && <SameForAll />}
                {rows.map((row) => (
                    <VariantRowEditor key={row.key} row={row} />
                ))}
                {rowsError?.message && <span className={ERROR_CLASS}>{rowsError.message}</span>}
            </div>
        </div>
    );
}

/** One option: its name, and its values as tags (typed one at a time, or several split by commas). */
function OptionEditor({
    option,
    placeholder,
    onRename,
    onValues,
    onRemove,
    canRemove,
}: {
    option: OptionDraft;
    placeholder: string;
    onRename: (name: string) => void;
    /** Returns why the values can't change, or null. */
    onValues: (values: string[]) => string | null;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const [draft, setDraft] = useState("");
    const [problem, setProblem] = useState<string | null>(null);
    const full = option.values.length >= SHOP_LIMITS.maxOptionValues;

    const add = () => {
        const typed = draft
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        if (typed.length === 0) return;
        const fresh = typed.filter((value, index) => !option.values.some((each) => sameWord(each, value)) && typed.findIndex((each) => sameWord(each, value)) === index);
        if (fresh.length === 0) {
            setProblem(typed.length === 1 ? `${typed[0]} is already there` : "Those are already there");
            return;
        }
        if (option.values.length + fresh.length > SHOP_LIMITS.maxOptionValues) {
            setProblem(`An option can have up to ${SHOP_LIMITS.maxOptionValues} values`);
            return;
        }
        const tooLong = fresh.find((value) => value.length > SHOP_LIMITS.optionValueMax);
        if (tooLong) {
            setProblem(`Keep each value to ${SHOP_LIMITS.optionValueMax} characters`);
            return;
        }
        const blocked = onValues([...option.values, ...fresh]);
        setProblem(blocked);
        if (!blocked) setDraft("");
    };

    const nameId = `option-name-${option.key}`;
    const valueId = `option-value-${option.key}`;
    return (
        <div className="flex flex-col gap-3 rounded-lg bg-mist-50 p-3">
            <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                    <label htmlFor={nameId} className={LABEL_CLASS}>
                        Option name
                    </label>
                    <Input
                        id={nameId}
                        value={option.name}
                        onChange={(event) => onRename(event.target.value)}
                        placeholder={placeholder}
                        maxLength={SHOP_LIMITS.optionNameMax}
                        autoComplete="off"
                        className={cn(inputClass(), "bg-white")}
                    />
                </div>
                {canRemove && (
                    <Button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Remove ${option.name.trim() || "this option"}`}
                        className="size-11 shrink-0 bg-white border border-border text-mist-600 hover:bg-mist-100 rounded-lg cursor-pointer"
                    >
                        <Trash2 className="size-4" aria-hidden />
                    </Button>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor={valueId} className={LABEL_CLASS}>
                    Values
                </label>
                {option.values.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                        {option.values.map((value) => (
                            <li key={value} className="flex items-center gap-1 rounded-full border border-border bg-white py-1 pl-3 pr-1 text-sm font-text text-mist-950">
                                {value}
                                <button
                                    type="button"
                                    onClick={() => setProblem(onValues(option.values.filter((each) => each !== value)))}
                                    aria-label={`Remove ${value}`}
                                    className="flex size-6 items-center justify-center rounded-full text-mist-500 hover:bg-mist-100 hover:text-mist-950 cursor-pointer"
                                >
                                    <X className="size-3.5" aria-hidden />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {!full && (
                    <div className="flex gap-2">
                        <Input
                            id={valueId}
                            value={draft}
                            onChange={(event) => {
                                setDraft(event.target.value);
                                setProblem(null);
                            }}
                            onKeyDown={(event) => {
                                // Enter adds the value rather than sending the form
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    add();
                                }
                            }}
                            placeholder={option.values.length === 0 ? "e.g. Red, Blue" : "Add another value"}
                            autoComplete="off"
                            className={cn(inputClass(problem ?? undefined), "bg-white")}
                        />
                        <Button
                            type="button"
                            onClick={add}
                            disabled={draft.trim() === ""}
                            className="h-11 px-4 shrink-0 bg-white border border-secondary-700 text-secondary-700 hover:bg-secondary-50 font-medium font-text rounded-button cursor-pointer disabled:opacity-50"
                        >
                            Add
                        </Button>
                    </div>
                )}
                {problem ? (
                    <span className={ERROR_CLASS}>{problem}</span>
                ) : (
                    <span className={HINT_CLASS}>{full ? `That's the most values an option can have.` : "Press Enter or Add after each one, or separate several with commas."}</span>
                )}
            </div>
        </div>
    );
}

/** Fills in a price and a stock for every variant on sale at once. */
function SameForAll() {
    const { getValues, setValue, formState } = useFormContext<VariantValues>();
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");

    const apply = () => {
        const values = getValues();
        const options = { shouldDirty: true, shouldValidate: formState.isSubmitted };
        for (const row of values.variantRows) {
            if (values[fieldName("vOn", row.key)] !== true) continue;
            if (price) setValue(fieldName("vPrice", row.key), price, options);
            if (stock && values[fieldName("vMade", row.key)] !== true) setValue(fieldName("vStock", row.key), stock, options);
        }
        setPrice("");
        setStock("");
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg bg-mist-50 p-3">
            <span className={HINT_CLASS}>Same for all on sale (optional)</span>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    value={price ? `₦${Number(price).toLocaleString("en-GB")}` : ""}
                    onChange={(event) => setPrice(event.target.value.replace(/\D/g, "").slice(0, 12))}
                    inputMode="numeric"
                    placeholder="Price"
                    aria-label="Price for every variant"
                    className={cn(inputClass(), "bg-white")}
                />
                <Input
                    value={stock}
                    onChange={(event) => setStock(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="Number in stock"
                    aria-label="Number in stock for every variant"
                    className={cn(inputClass(), "bg-white")}
                />
                <Button
                    type="button"
                    onClick={apply}
                    disabled={!price && !stock}
                    className="h-11 px-4 shrink-0 bg-white border border-secondary-700 text-secondary-700 hover:bg-secondary-50 font-medium font-text rounded-button cursor-pointer disabled:opacity-50"
                >
                    Apply to all
                </Button>
            </div>
        </div>
    );
}

/** One combination: on sale or not, and while it is, its price, stock or lead time, code and photos. */
function VariantRowEditor({ row }: { row: VariantRow }) {
    const { register, control, getValues, setValue, clearErrors, formState } = useFormContext<VariantValues>();
    const on = useWatch({ control, name: fieldName("vOn", row.key) }) === true;
    const madeToOrder = useWatch({ control, name: fieldName("vMade", row.key) }) === true;
    const photoCount = photosOf(useWatch({ control, name: fieldName("vPhotos", row.key) })).length;
    const [showPhotos, setShowPhotos] = useState(photoCount > 0);
    const label = row.values.join(" / ");
    const field = (config: FormFieldConfig) => (
        <FormField<VariantValues>
            field={config}
            register={register}
            control={control}
            getValues={getValues}
            setValue={setValue}
            errors={formState.errors}
            hideRequiredMark
        />
    );

    return (
        <div className={cn("flex flex-col gap-3 rounded-lg border border-border p-3", !on && "bg-mist-50")}>
            <div className="flex items-center justify-between gap-3">
                <span className={cn("min-w-0 break-words text-sm font-medium font-text", on ? "text-mist-950" : "text-mist-500")}>{label}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs font-text text-mist-500">
                    {on ? "On sale" : "Not sold"}
                    <Switch
                        checked={on}
                        onCheckedChange={(next: boolean) => {
                            setValue(fieldName("vOn", row.key), next, { shouldDirty: true });
                            clearErrors("variantRows");
                        }}
                        aria-label={`Sell ${label}`}
                    />
                </span>
            </div>
            {on && (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {field({
                            name: fieldName("vPrice", row.key),
                            type: "amount",
                            label: "Price",
                            placeholder: "e.g. 250,000",
                            validation: {
                                required: "Enter the price",
                                validate: (value: string) => Number(value) >= 1 || "Enter at least ₦1",
                            },
                        })}
                        {madeToOrder
                            ? field({
                                  name: fieldName("vLead", row.key),
                                  type: "number",
                                  label: "Days to make it",
                                  placeholder: "e.g. 21",
                                  step: 1,
                                  validation: { validate: wholeNumber(1, SHOP_LIMITS.maxLeadTimeDays, "days") },
                              })
                            : field({
                                  name: fieldName("vStock", row.key),
                                  type: "number",
                                  label: "Number in stock",
                                  placeholder: "e.g. 4",
                                  step: 1,
                                  validation: { validate: wholeNumber(0, SHOP_LIMITS.maxStock, "a number") },
                              })}
                        {field({
                            name: fieldName("vSku", row.key),
                            type: "text",
                            label: "SKU (optional)",
                            placeholder: "Your code for it",
                            maxLength: SHOP_LIMITS.skuMax,
                            autoComplete: "off",
                        })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {field({ name: fieldName("vMade", row.key), type: "checkbox", label: "Made to order", className: "flex-none" })}
                        <button type="button" onClick={() => setShowPhotos((shown) => !shown)} className={cn(LINK_BUTTON_CLASS, "flex items-center gap-1.5")}>
                            <ImagePlus className="size-4" aria-hidden />
                            {showPhotos ? "Hide photos" : photoCount > 0 ? `Photos (${photoCount})` : "Add photos"}
                        </button>
                    </div>
                    {/* Hidden rather than taken away, so an upload carries on while it's closed */}
                    <div className={showPhotos || formState.errors[fieldName("vPhotos", row.key)] ? undefined : "hidden"}>
                        {field({
                            name: fieldName("vPhotos", row.key),
                            type: "image",
                            description: `Up to ${SHOP_LIMITS.maxVariantImages} photos of this variant, JPG, PNG or WebP, ${DEFAULT_MAX_FILE_SIZE_MB}MB each. Customers see them when they pick it.`,
                            accept: API_PHOTO_ACCEPT,
                            multiple: true,
                            maxFiles: SHOP_LIMITS.maxVariantImages,
                            uploadPurpose: "shop-product-image",
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
