"use client";

import {
    MANUFACTURER_ACTIVE_JOBS_URL,
    MANUFACTURER_JOBS_URL,
    type JobsPageTab,
} from "@/constant/manufacturer";
import SwipeableTabs from "../swipeableTabs";
import ActiveJobsPanel from "./activeJobsPanel";
import OpenJobsPanel from "./openJobsPanel";

// ─────────────────────────────────────────────────────────────────────────────
// Jobs — two tabs: open jobs any manufacturer can apply for, and active jobs
// already assigned to this one. Swipeable on phones. The open tab is where
// the plan's concurrent job limit shows up: each active job and application
// uses a slot, and applying needs a free one.
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturerJobsPage({ initialTab }: { initialTab: JobsPageTab }) {
    return (
        <div className="flex flex-col gap-6 z-1">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Jobs</h1>

            <SwipeableTabs<JobsPageTab>
                label="Jobs"
                idPrefix="jobs"
                initialValue={initialTab}
                // Keeps the URL on the tab being viewed (without a navigation),
                // so a refresh or a shared link opens the same one
                onChange={(tab) =>
                    window.history.replaceState(
                        null,
                        "",
                        tab === "active" ? MANUFACTURER_ACTIVE_JOBS_URL : MANUFACTURER_JOBS_URL,
                    )
                }
                tabs={[
                    { value: "open", label: "Open jobs", panel: <OpenJobsPanel /> },
                    { value: "active", label: "Active jobs", panel: <ActiveJobsPanel /> },
                ]}
            />
        </div>
    );
}
