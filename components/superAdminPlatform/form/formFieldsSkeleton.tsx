import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";

export type SkeletonField = { name: string; label: string; description?: string };

/**
 * A settings form while the values it edits load: each field's label and
 * description show straight away, laid out as MainForm lays them out (two
 * to a row from md where `rowPairs` says so), with a skeleton where the
 * input and its value go. The save button shows, off until they've loaded.
 */
export default function FormFieldsSkeleton({
    fields,
    submitLabel,
    rowPairs = [],
    footerClassName,
}: {
    fields: SkeletonField[];
    /** The save button's label, e.g. "Save job rules". */
    submitLabel: string;
    /** Fields side by side from md, by name, as in MainForm's `rowPairs`. */
    rowPairs?: [string, string][];
    /** The footer row, e.g. "justify-end" (the default) or "justify-between". */
    footerClassName?: string;
}) {
    const paired = new Set(rowPairs.flat());
    const rows: SkeletonField[][] = [];
    for (const field of fields) {
        if (!paired.has(field.name)) {
            rows.push([field]);
            continue;
        }
        const pair = rowPairs.find(([first]) => first === field.name);
        if (pair) rows.push(pair.map((name) => fields.find((f) => f.name === name)).filter((f) => !!f));
    }

    return (
        <div className="flex flex-col gap-5" aria-busy="true">
            <div className="flex flex-col gap-4">
                {rows.map((row) => (
                    <div key={row.map((field) => field.name).join("+")} className="flex flex-col gap-4 md:flex-row">
                        {row.map((field) => (
                            <div key={field.name} className="flex flex-1 flex-col gap-1.5">
                                <span className="text-sm font-medium font-text text-[#1F2937]">{field.label}</span>
                                <Skeleton className="h-11 w-full rounded-lg" />
                                {field.description && (
                                    <span className="text-xs font-normal font-text text-[#9CA3AF]">{field.description}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className={cn("flex items-center justify-end gap-3", footerClassName)}>
                <FormSubmitButton label={submitLabel} isLoading={false} disabled className="w-auto px-6" />
            </div>
        </div>
    );
}
