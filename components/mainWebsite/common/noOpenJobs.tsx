import { BriefcaseBusiness } from "lucide-react";

/**
 * In place of the job cards when there are none to show: no job is open
 * right now, or (`unavailable`) the jobs couldn't be loaded.
 */
export default function NoOpenJobs({ unavailable = false }: { unavailable?: boolean }) {
    return (
        <div className="flex w-full flex-col items-center gap-3 rounded-[10px] border border-dashed border-mist-300 px-6 py-16 text-center">
            <BriefcaseBusiness className="size-8 text-mist-400" strokeWidth={1.5} aria-hidden />
            <p className="text-lg font-medium">{unavailable ? "Jobs couldn't be loaded" : "No open jobs right now"}</p>
            <p className="max-w-sm text-sm font-light text-mist-600">
                {unavailable
                    ? "Please refresh the page in a minute."
                    : "New jobs are posted often. Create your profile now so you're ready to apply."}
            </p>
        </div>
    );
}
