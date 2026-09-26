import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/manufacturerPlatform/dashboardLayout/userAvatar";
import type { JobAssignee } from "@/constant/manufacturer";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "./styles";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailCallAssignee — replaces the chat/activity thread. A real `tel:`
// link instead of a message composer: one contact card, one call button.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailCallAssignee({ assignee }: { assignee: JobAssignee | null }) {
    if (!assignee) {
        return (
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold font-text text-mist-950">Assignee</h3>
                <p className="text-sm font-text text-mist-400">
                    No project assistant has been assigned to this job yet.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold font-text text-mist-950">Assignee</h3>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-mist-50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={assignee.name} className="size-10 text-sm shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium font-text text-mist-950 truncate">
                            {assignee.name}
                        </p>
                        <p className="text-xs font-text text-mist-400">{assignee.role}</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    nativeButton={false}
                    className={JOB_DETAIL_PRIMARY_BUTTON_CLASS}
                    render={<a href={`tel:${assignee.phone}`} />}
                >
                    <Phone data-icon="inline-start" />
                    Call assignee
                </Button>
            </div>
        </div>
    );
}
