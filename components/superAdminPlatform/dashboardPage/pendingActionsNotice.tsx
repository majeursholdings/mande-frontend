"use client";

import Link from "next/link";
import { ChevronRight, ListTodo } from "lucide-react";
import { SUPER_ADMIN_ACTIONS_URL } from "@/constant/superAdmin";
import { ACTION_KINDS, useSuperAdminActionsQuery } from "../actions/pendingActions";

/**
 * Above the dashboard while anything's waiting for a super admin: what, and
 * the way to Actions. Nothing while the queue loads (or fails to): it only
 * appears when there's something to do, so a placeholder would just jump.
 */
export default function PendingActionsNotice() {
    const { actions, isPending, isError } = useSuperAdminActionsQuery();
    if (isPending || isError || actions.length === 0) return null;

    const summary = ACTION_KINDS.flatMap(({ value, one, many }) => {
        const count = actions.filter((action) => action.kind === value).length;
        return count > 0 ? [`${count} ${count === 1 ? one : many}`] : [];
    }).join(", ");

    return (
        <Link
            href={SUPER_ADMIN_ACTIONS_URL}
            className="flex items-center gap-3 rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 transition-colors hover:bg-secondary-100"
        >
            <ListTodo className="size-5 shrink-0 text-secondary-700" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1 text-sm font-text text-mist-800">
                <span className="font-semibold text-mist-950">
                    {actions.length} action{actions.length === 1 ? "" : "s"} waiting for you:
                </span>{" "}
                {summary}.
            </span>
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium font-text text-secondary-700">
                Review
                <ChevronRight className="size-4" aria-hidden />
            </span>
        </Link>
    );
}
