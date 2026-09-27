import { formatOrdinalDate } from "@/lib/date";
import { getJobCountdownLabel, type AdminJob } from "@/constant/admin";
import { JobStatusBadge, LeadsLabel } from "./jobPeople";

const HEAD_CLASS = "px-4 py-4 text-xs font-medium font-text uppercase text-mist-500 whitespace-nowrap";
// Columns phones leave out — the countdown moves under the job name instead
const DESKTOP_ONLY = "hidden md:table-cell";

/**
 * The jobs list. Each row opens the job; the job name is the row's button
 * for keyboards and screen readers. Phones get job name (with countdown),
 * lead and status, scrolling sideways as needed.
 */
export default function JobsTable({
    jobs,
    firstIndex,
    onOpenJob,
}: {
    jobs: AdminJob[];
    /** The # of the first row on this page. */
    firstIndex: number;
    onOpenJob: (jobId: string) => void;
}) {
    return (
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-110 text-left md:min-w-0">
                <thead>
                    <tr className="bg-mist-50">
                        <th scope="col" className={`${HEAD_CLASS} ${DESKTOP_ONLY} w-12`}>#</th>
                        <th scope="col" className={HEAD_CLASS}>Job name</th>
                        <th scope="col" className={`${HEAD_CLASS} ${DESKTOP_ONLY}`}>Countdown</th>
                        <th scope="col" className={HEAD_CLASS}>Project lead</th>
                        <th scope="col" className={`${HEAD_CLASS} ${DESKTOP_ONLY}`}>Date assigned</th>
                        <th scope="col" className={`${HEAD_CLASS} ${DESKTOP_ONLY}`}>Due date</th>
                        <th scope="col" className={HEAD_CLASS}>Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border border-b border-border">
                    {jobs.map((job, index) => {
                        const countdown = getJobCountdownLabel(job);
                        return (
                            <tr
                                key={job.id}
                                onClick={() => onOpenJob(job.id)}
                                className="cursor-pointer transition-colors hover:bg-mist-50/60"
                            >
                                <td className={`${DESKTOP_ONLY} px-4 py-5 text-base font-text text-mist-900`}>
                                    {firstIndex + index}
                                </td>
                                <td className="min-w-40 px-4 py-4 md:py-5">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            // The row handles the click; this is for keyboards
                                            event.stopPropagation();
                                            onOpenJob(job.id);
                                        }}
                                        className="text-left text-base font-text text-mist-950 outline-none hover:underline focus-visible:underline"
                                    >
                                        {job.title}
                                    </button>
                                    <p className="text-sm font-text text-mist-500 md:hidden">{countdown}</p>
                                </td>
                                <td className={`${DESKTOP_ONLY} px-4 py-5 text-base font-text whitespace-nowrap text-mist-900`}>
                                    {countdown}
                                </td>
                                <td className="px-4 py-4 text-base font-text text-mist-900 md:py-5">
                                    <LeadsLabel leadIds={job.projectLeadIds} />
                                </td>
                                <td className={`${DESKTOP_ONLY} px-4 py-5 text-base font-text whitespace-nowrap text-mist-900`}>
                                    {job.dateAssigned ? formatOrdinalDate(new Date(job.dateAssigned)) : "Not yet assigned"}
                                </td>
                                <td className={`${DESKTOP_ONLY} px-4 py-5 text-base font-text whitespace-nowrap text-mist-900`}>
                                    {formatOrdinalDate(new Date(job.dueDate))}
                                </td>
                                <td className="px-4 py-4 md:py-5">
                                    <JobStatusBadge status={job.status} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
