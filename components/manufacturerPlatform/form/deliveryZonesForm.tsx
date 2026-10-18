"use client";

import { useRef, useState, type MouseEvent } from "react";
import { useForm, useFormState, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import Notice from "@/components/manufacturerPlatform/notice";
import { NIGERIAN_STATES, SHOP_LIMITS, type NigerianState } from "@/constant/shop";
import { getErrorMessage } from "@/lib/api";
import type { DeliveryZone } from "@/lib/services/shopService";
import { FormSubmitButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// DeliveryZonesForm: the groups of states a seller prices delivery for, e.g.
// "Lagos", "South West", "Rest of Nigeria". Each zone is a row of two MainForm
// fields, its name and its states; adding or removing a zone changes the
// field list. Each state can be in one zone at most, so a zone's list only
// offers the states no other zone has. Saving sends every zone: one kept
// keeps its id (and products' fees for it); one removed takes its fees off
// every product.
//
// Field names are flat (zoneName_<key>, zoneStates_<key>) because the shared
// FormField shows the error for a top-level name only. A saved zone's key is
// its id; a new one's starts with "new-".
// ─────────────────────────────────────────────────────────────────────────────

export type ZoneInput = { id?: string; name: string; states: NigerianState[] };

type ZonesValues = Record<`zoneName_${string}` | `zoneStates_${string}`, string | NigerianState[]>;

const NEW_PREFIX = "new-";
const nameField = (key: string) => `zoneName_${key}` as const;
const statesField = (key: string) => `zoneStates_${key}` as const;

function toValues(zones: DeliveryZone[]): ZonesValues {
    const values: ZonesValues = {};
    for (const zone of zones) {
        values[nameField(zone.id)] = zone.name;
        values[statesField(zone.id)] = zone.states;
    }
    return values;
}

export default function DeliveryZonesForm({
    zones,
    onSave,
    onCancel,
}: {
    zones: DeliveryZone[];
    onSave: (zones: ZoneInput[]) => Promise<void>;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    // The zones on the form, in order: saved ones by id, new ones by a made-up key
    const [keys, setKeys] = useState<string[]>(() => zones.map((zone) => zone.id));
    const nextNewKey = useRef(0);
    const methods = useForm<ZonesValues>({ mode: "onTouched", defaultValues: toValues(zones) });
    const values = useWatch({ control: methods.control }) as ZonesValues;

    const addZone = () => {
        const key = `${NEW_PREFIX}${nextNewKey.current++}`;
        methods.setValue(nameField(key), "");
        methods.setValue(statesField(key), []);
        setKeys((current) => [...current, key]);
    };

    const removeZone = (event: MouseEvent, key: string) => {
        // The button sits in the field's label: don't let the click reach the field too
        event.preventDefault();
        event.stopPropagation();
        methods.unregister([nameField(key), statesField(key)]);
        setKeys((current) => current.filter((candidate) => candidate !== key));
    };

    const fields: FormFieldConfig[] = keys.flatMap((key, index): FormFieldConfig[] => {
        // States in the other zones aren't offered here
        const taken = new Set(keys.filter((other) => other !== key).flatMap((other) => (values[statesField(other)] as NigerianState[] | undefined) ?? []));
        return [
            {
                name: nameField(key),
                type: "text",
                label: (
                    <span className="flex w-full items-center justify-between gap-3">
                        <span>Zone {index + 1} name</span>
                        <button
                            type="button"
                            onClick={(event) => removeZone(event, key)}
                            className="text-xs font-medium font-text text-secondary-700 hover:underline cursor-pointer"
                        >
                            Remove zone
                        </button>
                    </span>
                ),
                placeholder: "e.g. Lagos, or South West",
                maxLength: SHOP_LIMITS.zoneNameMax,
                autoComplete: "off",
                validation: {
                    required: "Name the zone",
                    validate: (value: string, all: Record<string, unknown>) => {
                        const name = value.trim().toLowerCase();
                        if (name.length < 2) return "Use at least 2 characters";
                        const twin = keys.some((other) => other !== key && String(all[nameField(other)] ?? "").trim().toLowerCase() === name);
                        return !twin || "Two zones have this name";
                    },
                },
            },
            {
                name: statesField(key),
                type: "multiselect",
                label: `States in zone ${index + 1}`,
                placeholder: "Choose the states in this zone",
                options: NIGERIAN_STATES.filter((state) => !taken.has(state)).map((state) => ({ value: state, label: state })),
                validation: { validate: (value: string[]) => (Array.isArray(value) && value.length > 0) || "Add at least one state" },
            },
        ];
    });

    const removedSaved = zones.some((zone) => !keys.includes(zone.id));
    const changed = removedSaved || keys.some((key) => key.startsWith(NEW_PREFIX));

    const handleSubmit = async (submitted: ZonesValues) => {
        setIsLoading(true);
        try {
            await onSave(
                keys.map((key) => ({
                    ...(!key.startsWith(NEW_PREFIX) && { id: key }),
                    name: String(submitted[nameField(key)] ?? "").trim(),
                    states: (submitted[statesField(key)] as NigerianState[] | undefined) ?? [],
                })),
            );
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save your delivery zones. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ZonesValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            rowPairs={keys.map((key) => [nameField(key), statesField(key)] as [string, string])}
            hideRequiredMarks
            fieldGapClassName="gap-5"
            footerSlot={
                <div className="flex flex-col gap-4">
                    {keys.length === 0 && (
                        <p className="text-sm font-text text-mist-500">No zones yet. Add one for each area you price delivery differently for.</p>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addZone}
                        disabled={keys.length >= SHOP_LIMITS.maxZones}
                        className="h-11 w-fit gap-1.5 rounded-lg border-gray-200 px-4 text-sm font-medium font-text text-mist-950 cursor-pointer"
                    >
                        <Plus className="size-4" />
                        Add a zone
                    </Button>
                    {removedSaved && (
                        <Notice tone="warning">Removing a zone takes its delivery fee off every product. Products no longer deliver to its states.</Notice>
                    )}
                </div>
            }
            renderFooter={({ isLoading, canSubmit }) => (
                <FormActions control={methods.control} isLoading={isLoading} canSubmit={canSubmit} changed={changed} onCancel={onCancel} />
            )}
        />
    );
}

/** Cancel and save. Reads isDirty here, so a change to it re-renders only these buttons. */
function FormActions({
    control,
    isLoading,
    canSubmit,
    changed,
    onCancel,
}: {
    control: Control<ZonesValues>;
    isLoading: boolean;
    canSubmit: boolean;
    /** A zone was added or removed (the field values alone don't show it). */
    changed: boolean;
    onCancel: () => void;
}) {
    const { isDirty } = useFormState({ control });
    return (
        <div className="flex justify-end gap-3">
            <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
            >
                Cancel
            </Button>
            <FormSubmitButton label="Save zones" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit || !(isDirty || changed)} className="w-auto px-5" />
        </div>
    );
}
