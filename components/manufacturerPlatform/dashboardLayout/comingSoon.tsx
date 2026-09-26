import { type LucideIcon } from "lucide-react";

export default function ComingSoon({
    icon: Icon,
    title,
}: {
    icon: LucideIcon;
    title: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-white py-24 text-center">
            <span className="flex items-center justify-center size-14 rounded-full bg-mist-100">
                <Icon className="size-6 text-mist-400" strokeWidth={1.5} />
            </span>
            <h1 className="text-lg font-semibold font-text text-mist-900">{title}</h1>
            <p className="text-sm font-text text-mist-500">This page is coming soon.</p>
        </div>
    );
}
