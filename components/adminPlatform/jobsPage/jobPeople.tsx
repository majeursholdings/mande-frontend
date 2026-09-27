import { StatusBadge } from "@/components/customTable/statusBadge";
import UserAvatar from "@/components/ui/userAvatar";
import { cn } from "@/lib/utils";
import {
    ADMIN_JOB_STATUS_CONFIG,
    getProjectLead,
    type AdminJobStatus,
} from "@/constant/admin";

/** A person as avatar + name — a project lead, a manufacturer. */
export function PersonLabel({
    name,
    avatarUrl,
    size = "md",
    className,
}: {
    name: string;
    avatarUrl?: string | null;
    size?: "sm" | "md";
    className?: string;
}) {
    return (
        <span className={cn("flex min-w-0 items-center gap-3", size === "sm" && "gap-2", className)}>
            <UserAvatar
                name={name}
                src={avatarUrl}
                className={size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs"}
            />
            <span className="truncate">{name}</span>
        </span>
    );
}

/** A job's first project lead, with "+1" when it has more. */
export function LeadsLabel({ leadIds, size }: { leadIds: string[]; size?: "sm" | "md" }) {
    const [first, ...rest] = leadIds.map(getProjectLead).filter((lead) => !!lead);
    if (!first) return <span className="text-mist-400">Unassigned</span>;

    return (
        <span className="flex min-w-0 items-center gap-2">
            <PersonLabel name={first.name} avatarUrl={first.avatarUrl} size={size} />
            {rest.length > 0 && (
                <span
                    className="shrink-0 rounded-full bg-mist-100 px-1.5 py-0.5 text-[11px] font-medium text-mist-600"
                    title={rest.map((lead) => lead.name).join(", ")}
                >
                    +{rest.length}
                </span>
            )}
        </span>
    );
}

export function JobStatusBadge({ status }: { status: AdminJobStatus }) {
    const config = ADMIN_JOB_STATUS_CONFIG[status];
    return <StatusBadge label={config.label} tone={config.tone} variant="pill" />;
}
