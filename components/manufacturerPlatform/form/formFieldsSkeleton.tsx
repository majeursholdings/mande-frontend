import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIMARY_BUTTON_CLASS } from "./formButtons";

/**
 * A prefilled form while the values it shows load: the same layout as
 * MainForm, with each field's label shown and a skeleton where its input
 * (and the saved value in it) will be, and the submit button greyed out.
 */
export default function FormFieldsSkeleton({
    fields,
    rowPairs = [],
    description,
    submitLabel = "Save",
}: {
    fields: { name: string; label?: ReactNode }[];
    rowPairs?: string[][];
    description?: ReactNode;
    submitLabel?: string;
}) {
    const rendered = new Set<string>();
    const fieldSkeleton = (field: { name: string; label?: ReactNode }) => (
        <div key={field.name} className="flex flex-1 flex-col gap-1.5">
            {field.label && (
                <span className="flex items-center gap-2 text-sm font-medium font-text text-[#1F2937]">{field.label}</span>
            )}
            <Skeleton className="h-11 w-full rounded-lg" />
        </div>
    );

    return (
        <div className="flex flex-col gap-5" aria-busy>
            {description && (
                <p className="text-[#6B7280] text-sm font-normal font-text leading-5">{description}</p>
            )}
            <div className="flex flex-col gap-4">
                {fields.map((field) => {
                    if (rendered.has(field.name)) return null;
                    const pair = rowPairs.find((p) => p.includes(field.name));
                    const partner = pair && fields.find((f) => f.name !== field.name && pair.includes(f.name));
                    if (partner) {
                        rendered.add(field.name);
                        rendered.add(partner.name);
                        return (
                            <div key={pair.join("-")} className="flex flex-col gap-4 md:flex-row">
                                {fieldSkeleton(field)}
                                {fieldSkeleton(partner)}
                            </div>
                        );
                    }
                    rendered.add(field.name);
                    return fieldSkeleton(field);
                })}
            </div>
            <div className="flex justify-end">
                <Button type="button" disabled className={cn(PRIMARY_BUTTON_CLASS, "disabled:bg-mist-200 disabled:opacity-100")}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
}
