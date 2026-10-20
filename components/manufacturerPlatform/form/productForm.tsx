"use client";

import { useRef, useState } from "react";
import { useForm, useFormContext, useFormState, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";
import MainForm, { FormField } from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { API_PHOTO_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import Notice from "@/components/manufacturerPlatform/notice";
import { Button } from "@/components/ui/button";
import { SHOP_CATEGORY_OPTIONS, SHOP_LIMITS, subcategoryOptions } from "@/constant/shop";
import { getErrorMessage } from "@/lib/api";
import type { CreateProductPayload, DeliveryZone, ProductPayload, SellerProduct } from "@/lib/services/shopService";
import { FormSubmitButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// ProductForm: adding or editing a product on the shop, for a manufacturer's
// store or MANDE's own stock (the parent says which by what it does with the
// payload). Photos (the first is the cover), name, category and subcategory,
// description, price, in stock or made to order, and how it reaches the
// customer: a fee for each of the seller's delivery zones it goes to, and/or
// free pickup. Prices are entered in naira and sent in kobo.
//
// A new product can be saved as a draft or listed straight away (when the
// seller can list); an edit saves in place, and a listed product has to stay
// ready to list (the API checks).
//
// Field names are flat (fee_<zoneId>, not fees.<zoneId>.fee) because the
// shared FormField shows the error for a top-level name only.
// ─────────────────────────────────────────────────────────────────────────────

type Photo = { publicId: string; url: string };

type ProductValues = {
    photos: Photo[];
    title: string;
    category: string;
    subcategory: string;
    description: string;
    /** Naira, digits only (the amount field). */
    price: string;
    availability: "stock" | "made-to-order";
    stock: string;
    leadTimeDays: string;
    /** Taken back for a change of mind (stocked products only; made to order never is). */
    returnable: boolean;
    pickup: boolean;
    pickupAddress: string;
    // Per delivery zone: feeOn_<id>, fee_<id>, extra_<id>, eta_<id>
    [zoneField: `${"feeOn" | "fee" | "extra" | "eta"}_${string}`]: string | boolean;
};

const nairaOf = (kobo: number) => String(Math.round(kobo / 100));
const koboOf = (naira: string) => Math.round(Number(naira || 0) * 100);

function toValues(product: SellerProduct | undefined, zones: DeliveryZone[], defaultPickupAddress: string): ProductValues {
    const values: ProductValues = {
        photos: (product?.images ?? []).flatMap((image) => (image.url ? [{ publicId: image.publicId, url: image.url }] : [])),
        title: product?.title ?? "",
        category: product?.category ?? "",
        subcategory: product?.subcategory ?? "",
        description: product?.description ?? "",
        price: product ? nairaOf(product.priceKobo) : "",
        availability: product && product.stock === null ? "made-to-order" : "stock",
        stock: product?.stock != null ? String(product.stock) : "",
        leadTimeDays: product?.leadTimeDays != null ? String(product.leadTimeDays) : "",
        returnable: product?.returnable ?? true,
        pickup: product?.delivery.pickup.available ?? false,
        // The seller's own address until they say otherwise
        pickupAddress: product?.delivery.pickup.address || defaultPickupAddress,
    };
    for (const zone of zones) {
        const fee = product?.delivery.fees.find((entry) => entry.zoneId === zone.id);
        values[`feeOn_${zone.id}`] = !!fee;
        values[`fee_${zone.id}`] = fee ? nairaOf(fee.feeKobo) : "";
        values[`extra_${zone.id}`] = fee ? nairaOf(fee.extraUnitKobo) : "";
        values[`eta_${zone.id}`] = fee ? String(fee.etaDays) : "";
    }
    return values;
}

function toPayload(values: ProductValues, zones: DeliveryZone[]): ProductPayload {
    const madeToOrder = values.availability === "made-to-order";
    return {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        subcategory: values.subcategory,
        images: values.photos.map((photo) => ({ publicId: photo.publicId })),
        priceKobo: koboOf(values.price),
        stock: madeToOrder ? null : Number(values.stock),
        leadTimeDays: madeToOrder ? Number(values.leadTimeDays) : null,
        returnable: values.returnable,
        delivery: {
            fees: zones
                .filter((zone) => values[`feeOn_${zone.id}`] === true)
                .map((zone) => ({
                    zoneId: zone.id,
                    feeKobo: koboOf(String(values[`fee_${zone.id}`] ?? "")),
                    extraUnitKobo: koboOf(String(values[`extra_${zone.id}`] ?? "")),
                    etaDays: Number(values[`eta_${zone.id}`]),
                })),
            pickup: { available: values.pickup, address: values.pickup ? values.pickupAddress.trim() : "" },
        },
    };
}

const wholeNumber = (min: number, max: number, label: string) => (value: string) =>
    (value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max) || `Enter ${label} from ${min} to ${max.toLocaleString("en-GB")}`;

const LABEL_CLASS = "text-[#1F2937] text-sm font-medium font-text";
const HINT_CLASS = "text-[#9CA3AF] text-xs font-normal font-text";

/** One delivery zone's row: whether it delivers there, the fee, the fee per extra unit, and how long it takes. */
function ZoneFeeRow({ zone }: { zone: DeliveryZone }) {
    const { register, control, getValues, setValue, formState } = useFormContext<ProductValues>();
    const on = useWatch({ control, name: `feeOn_${zone.id}` }) === true;
    const field = (config: FormFieldConfig) => (
        <FormField<ProductValues>
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
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            {field({
                name: `feeOn_${zone.id}`,
                type: "checkbox",
                label: (
                    <span className="flex flex-col">
                        <span className="font-medium text-mist-950">{zone.name}</span>
                        <span className={HINT_CLASS}>{zone.states.join(", ")}</span>
                    </span>
                ),
            })}
            {on && (
                <div className="grid gap-3 sm:grid-cols-3">
                    {field({
                        name: `fee_${zone.id}`,
                        type: "amount",
                        label: "Delivery fee",
                        placeholder: "0",
                        validation: {
                            validate: (value: string, values: Record<string, unknown>) => {
                                if (values[`feeOn_${zone.id}`] !== true) return true;
                                if (value.trim() === "") return "Enter the fee (0 for free delivery)";
                                return Number(value) <= SHOP_LIMITS.maxFeeNaira || "That fee is too high";
                            },
                        },
                    })}
                    {field({
                        name: `extra_${zone.id}`,
                        type: "amount",
                        label: "Each extra unit",
                        placeholder: "0",
                        description: "Added for every unit after the first.",
                    })}
                    {field({
                        name: `eta_${zone.id}`,
                        type: "number",
                        label: "Days to deliver",
                        placeholder: "e.g. 3",
                        step: 1,
                        validation: {
                            validate: (value: string, values: Record<string, unknown>) =>
                                values[`feeOn_${zone.id}`] !== true || wholeNumber(1, SHOP_LIMITS.maxEtaDays, "days")(value),
                        },
                    })}
                </div>
            )}
        </div>
    );
}

/** Availability, delivery and pickup, under the fields MainForm lays out. */
function DeliverySection({ zones, onManageZones, hasDefaultPickup }: { zones: DeliveryZone[]; onManageZones?: () => void; hasDefaultPickup: boolean }) {
    const { register, control, getValues, setValue, formState } = useFormContext<ProductValues>();
    const availability = useWatch({ control, name: "availability" });
    const pickup = useWatch({ control, name: "pickup" });
    const field = (config: FormFieldConfig) => (
        <FormField<ProductValues>
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
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
                {field({
                    name: "availability",
                    type: "radio",
                    label: "Availability",
                    options: [
                        { value: "stock", label: "In stock" },
                        { value: "made-to-order", label: "Made to order" },
                    ],
                })}
                {availability === "made-to-order"
                    ? field({
                          name: "leadTimeDays",
                          type: "number",
                          label: "Days to make it",
                          placeholder: "e.g. 21",
                          step: 1,
                          description: "Customers see roughly how long it takes before it's ready.",
                          validation: { validate: wholeNumber(1, SHOP_LIMITS.maxLeadTimeDays, "days") },
                      })
                    : field({
                          name: "stock",
                          type: "number",
                          label: "Number in stock",
                          placeholder: "e.g. 4",
                          step: 1,
                          description: "It shows as sold out at 0.",
                          validation: { validate: wholeNumber(0, SHOP_LIMITS.maxStock, "a number") },
                      })}
                {availability === "made-to-order" ? (
                    <p className={HINT_CLASS}>Made-to-order products are only returned if there&apos;s a problem with them (faulty, damaged, wrong or not as described).</p>
                ) : (
                    field({
                        name: "returnable",
                        type: "checkbox",
                        label: (
                            <span className="flex flex-col">
                                <span className="font-medium text-mist-950">Take it back if the customer changes their mind</span>
                                <span className={HINT_CLASS}>Within 7 days of delivery, unused, refunded as store credit. Problems are always returnable.</span>
                            </span>
                        ),
                    })
                )}
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <span className={LABEL_CLASS}>Delivery</span>
                    <span className={HINT_CLASS}>Tick each zone it goes to. A state in none of them can&apos;t order it, unless they pick it up.</span>
                </div>
                {zones.length === 0 ? (
                    <Notice>
                        You haven&apos;t set up delivery zones yet.{" "}
                        {onManageZones ? (
                            <button type="button" onClick={onManageZones} className="font-medium text-secondary-700 hover:underline cursor-pointer">
                                Set up your zones
                            </button>
                        ) : (
                            "Set them up in Delivery zones"
                        )}{" "}
                        first, or offer pickup.
                    </Notice>
                ) : (
                    zones.map((zone) => <ZoneFeeRow key={zone.id} zone={zone} />)
                )}
                {field({ name: "pickup", type: "checkbox", label: "Customers can pick it up for free" })}
                {pickup &&
                    field({
                        name: "pickupAddress",
                        type: "text",
                        label: "Pickup address",
                        placeholder: "e.g. 20 Peacock Drive, Lekki, Lagos",
                        description: hasDefaultPickup ? "Your address from your profile, unless you change it here." : undefined,
                        maxLength: SHOP_LIMITS.pickupAddressMax,
                        validation: {
                            validate: (value: string, values: Record<string, unknown>) => !values.pickup || value.trim().length >= 5 || "Say where customers collect from",
                        },
                    })}
            </div>
        </div>
    );
}

export default function ProductForm({
    product,
    zones,
    defaultPickupAddress = "",
    canList,
    cannotListReason,
    onCreate,
    onUpdate,
    onCancel,
    onManageZones,
}: {
    /** Set to edit it; left out to add one. */
    product?: SellerProduct;
    /** The seller's delivery zones. */
    zones: DeliveryZone[];
    /** Where pickup starts: the manufacturer's address (empty for MANDE stock). */
    defaultPickupAddress?: string;
    /** Whether "Save and list" can be offered for a new product. */
    canList: boolean;
    /** Why it can't, shown under the buttons. */
    cannotListReason?: string | null;
    onCreate?: (payload: CreateProductPayload) => Promise<void>;
    onUpdate?: (payload: ProductPayload) => Promise<void>;
    onCancel: () => void;
    /** Opens the delivery zones, from the note shown when there are none. */
    onManageZones?: () => void;
}) {
    const isEdit = !!product;
    const [isLoading, setIsLoading] = useState(false);
    // Which button sent the form: set in its click handler, read on submit
    const intent = useRef<"draft" | "listed">("draft");
    const methods = useForm<ProductValues>({ mode: "onTouched", defaultValues: toValues(product, zones, defaultPickupAddress) });
    const category = useWatch({ control: methods.control, name: "category" });

    const fields: FormFieldConfig[] = [
        {
            name: "photos",
            type: "image",
            label: "Photos",
            description: `Up to ${SHOP_LIMITS.maxImages} photos, JPG, PNG or WebP, ${DEFAULT_MAX_FILE_SIZE_MB}MB each. The first is the cover. Listing needs at least one.`,
            accept: API_PHOTO_ACCEPT,
            multiple: true,
            maxFiles: SHOP_LIMITS.maxImages,
            uploadPurpose: "shop-product-image",
        },
        {
            name: "title",
            type: "text",
            label: "Product name",
            placeholder: "e.g. Solid oak king bed",
            maxLength: SHOP_LIMITS.titleMax,
            autoComplete: "off",
            validation: {
                required: "Give the product a name",
                validate: (value: string) => value.trim().length >= SHOP_LIMITS.titleMin || `Use at least ${SHOP_LIMITS.titleMin} characters`,
            },
        },
        {
            name: "category",
            type: "select",
            label: "Category",
            placeholder: "Choose a category",
            options: SHOP_CATEGORY_OPTIONS,
            validation: {
                required: "Choose a category",
                // A new category needs its own subcategory
                onChange: () => methods.setValue("subcategory", ""),
            },
        },
        {
            name: "subcategory",
            type: "select",
            label: "Subcategory",
            placeholder: category ? "Choose a subcategory" : "Choose a category first",
            options: subcategoryOptions(category),
            disabled: !category,
            validation: { required: "Choose a subcategory" },
        },
        {
            name: "description",
            type: "textarea",
            label: "Description (optional)",
            placeholder: "Sizes, materials, finishes, what's included...",
            height: 120,
            validation: {
                maxLength: { value: SHOP_LIMITS.descriptionMax, message: `Keep it to ${SHOP_LIMITS.descriptionMax.toLocaleString("en-GB")} characters` },
            },
        },
        {
            name: "price",
            type: "amount",
            label: "Price",
            placeholder: "e.g. 250,000",
            description: "What the customer pays for one, before delivery.",
            validation: {
                required: "Enter the price",
                validate: (value: string) => Number(value) >= 1 || "Enter at least ₦1",
            },
        },
    ];

    const handleSubmit = async (values: ProductValues) => {
        const listing = !isEdit && intent.current === "listed";
        if ((listing || product?.status === "listed") && values.photos.length === 0) {
            methods.setError("photos", { message: "Add at least one photo to list it" });
            return;
        }
        setIsLoading(true);
        try {
            const payload = toPayload(values, zones);
            if (isEdit) await onUpdate?.(payload);
            else await onCreate?.({ ...payload, status: listing ? "listed" : "draft" });
        } catch (err) {
            toast.error(getErrorMessage(err, isEdit ? "Couldn't save the product. Please try again." : "Couldn't add the product. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ProductValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            rowPairs={[["category", "subcategory"]]}
            hideRequiredMarks
            footerSlot={<DeliverySection zones={zones} onManageZones={onManageZones} hasDefaultPickup={!!defaultPickupAddress} />}
            renderFooter={({ isLoading, canSubmit }) => (
                <FormActions
                    control={methods.control}
                    isEdit={isEdit}
                    isLoading={isLoading}
                    canSubmit={canSubmit}
                    canList={canList}
                    cannotListReason={cannotListReason}
                    onCancel={onCancel}
                    onIntent={(next) => {
                        intent.current = next;
                    }}
                />
            )}
        />
    );
}

/** Cancel, and save (an edit) or save as a draft and list (a new product). */
function FormActions({
    control,
    isEdit,
    isLoading,
    canSubmit,
    canList,
    cannotListReason,
    onCancel,
    onIntent,
}: {
    control: Control<ProductValues>;
    isEdit: boolean;
    isLoading: boolean;
    canSubmit: boolean;
    canList: boolean;
    cannotListReason?: string | null;
    onCancel: () => void;
    onIntent: (intent: "draft" | "listed") => void;
}) {
    const { isDirty } = useFormState({ control });
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap justify-end gap-3">
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                >
                    Cancel
                </Button>
                {isEdit ? (
                    <FormSubmitButton label="Save changes" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit || !isDirty} className="w-auto px-5" />
                ) : (
                    <>
                        <Button
                            type="submit"
                            onClick={() => onIntent("draft")}
                            disabled={isLoading || !canSubmit}
                            className="h-11 px-5 border border-secondary-700 bg-white text-secondary-700 hover:bg-secondary-50 font-medium font-text rounded-button cursor-pointer disabled:opacity-50"
                        >
                            Save as draft
                        </Button>
                        <FormSubmitButton
                            label="Save and list"
                            loadingLabel="Saving..."
                            isLoading={isLoading}
                            disabled={!canSubmit || !canList}
                            onClick={() => onIntent("listed")}
                            className="w-auto px-5"
                        />
                    </>
                )}
            </div>
            {!isEdit && !canList && cannotListReason && <p className="text-right text-xs font-text text-mist-500">{cannotListReason} You can save it as a draft for now.</p>}
        </div>
    );
}
