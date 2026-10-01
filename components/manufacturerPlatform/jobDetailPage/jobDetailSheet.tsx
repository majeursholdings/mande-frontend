"use client";

import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import {
    MANUFACTURER_ACTIVE_JOBS_URL,
    MANUFACTURER_JOBS_URL,
} from "@/constant/manufacturer";
import JobDetailContent from "./jobDetailContent";
import OpenJobDetailContent from "./openJobDetailContent";
import {
    useManufacturerJobDetail,
    JobDetailSkeleton,
    JobDetailNotFound,
} from "./useManufacturerJobDetail";

export default function JobDetailSheet({ jobId }: { jobId: string }) {
    const router = useRouter();
    const { data, isPending, isError } = useManufacturerJobDetail(jobId);

    const closeSlot = (
        <SheetClose className="p-1.5 rounded-full text-mist-400 hover:text-mist-700 hover:bg-mist-100 transition-colors cursor-pointer">
            <XIcon className="size-4.5" />
            <span className="sr-only">Close</span>
        </SheetClose>
    );

    const handleClose = () => {
        router.push(data?.type === "assigned" ? MANUFACTURER_ACTIVE_JOBS_URL : MANUFACTURER_JOBS_URL);
    };

    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open) handleClose();
            }}
        >
            <SheetContent
                side="right"
                showCloseButton={false}
                className="data-[side=right]:inset-0 data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:border-l-0 md:data-[side=right]:inset-y-0 md:data-[side=right]:left-auto md:data-[side=right]:right-0 md:data-[side=right]:w-full md:data-[side=right]:max-w-110 md:data-[side=right]:border-l md:data-[side=right]:border-border p-0 gap-0"
            >
                <SheetTitle className="sr-only">
                    {data?.job.title ?? "Job details"}
                </SheetTitle>
                {isPending ? (
                    <JobDetailSkeleton closeSlot={closeSlot} />
                ) : !data || isError ? (
                    <JobDetailNotFound closeSlot={closeSlot} onBack={handleClose} />
                ) : data.type === "open" ? (
                    <OpenJobDetailContent key={data.job.id} job={data.job} closeSlot={closeSlot} />
                ) : (
                    <JobDetailContent key={data.job.id} job={data.job} closeSlot={closeSlot} />
                )}
            </SheetContent>
        </Sheet>
    );
}
