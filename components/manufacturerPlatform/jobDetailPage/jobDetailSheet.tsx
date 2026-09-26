"use client";

import { notFound, useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import {
    JOBS,
    MANUFACTURER_ACTIVE_JOBS_URL,
    MANUFACTURER_JOBS_URL,
    OPEN_JOBS,
} from "@/constant/manufacturer";
import JobDetailContent from "./jobDetailContent";
import OpenJobDetailContent from "./openJobDetailContent";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailSheet — the intercepted-route ((.)[jobId]) chrome: a right-docked
// sheet on desktop, full screen on mobile. Always mounted "open" since this
// component only renders while the intercepted route is active; closing
// navigates back to the jobs board — on the tab the job is listed under —
// instead of toggling local state. Shows an open job to apply for, or one of
// the manufacturer's assigned jobs.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailSheet({ jobId }: { jobId: string }) {
    const router = useRouter();
    const openJob = OPEN_JOBS.find((j) => j.id === jobId);
    const job = openJob ? undefined : JOBS.find((j) => j.id === jobId);
    if (!openJob && !job) notFound();

    const closeSlot = (
        <SheetClose className="p-1.5 rounded-full text-mist-400 hover:text-mist-700 hover:bg-mist-100 transition-colors cursor-pointer">
            <XIcon className="size-4.5" />
            <span className="sr-only">Close</span>
        </SheetClose>
    );

    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open) router.push(openJob ? MANUFACTURER_JOBS_URL : MANUFACTURER_ACTIVE_JOBS_URL);
            }}
        >
            <SheetContent
                side="right"
                showCloseButton={false}
                className="data-[side=right]:inset-0 data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:border-l-0 md:data-[side=right]:inset-y-0 md:data-[side=right]:left-auto md:data-[side=right]:right-0 md:data-[side=right]:w-full md:data-[side=right]:max-w-110 md:data-[side=right]:border-l md:data-[side=right]:border-border p-0 gap-0"
            >
                <SheetTitle className="sr-only">{(openJob ?? job)?.title}</SheetTitle>
                {openJob ? (
                    <OpenJobDetailContent job={openJob} closeSlot={closeSlot} />
                ) : (
                    job && <JobDetailContent job={job} closeSlot={closeSlot} />
                )}
            </SheetContent>
        </Sheet>
    );
}
