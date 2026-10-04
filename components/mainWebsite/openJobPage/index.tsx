import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Tag, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { DEFAULT_IMAGE } from "@/constant/global";
import { getJobCategoryLabel, MANUFACTURER_JOBS_URL } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL, FAQ_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import { formatPrice, fromKobo } from "@/lib/currency";
import { formatOrdinalDate, formatShortDuration, getTimeAgoLabel } from "@/lib/date";
import { getJobPostingSchema, toJsonLd } from "@/lib/jobPostingSchema";
import type { WebsiteJob } from "@/lib/services/websiteService";
import CtaBand from "../common/ctaBand";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

// ─────────────────────────────────────────────────────────────────────────────
// Open job — one job open to applications, as visitors see it: what it is,
// what it pays and how long it runs, and the way to apply (a MANDE profile,
// or logging in to one). Carries the job's JobPosting structured data, so it
// can show in Google's job search.
// ─────────────────────────────────────────────────────────────────────────────

export default function OpenJobPage({ job, url }: { job: WebsiteJob; url: string }) {
    const start = new Date(job.startDate || job.postedAt);
    const due = new Date(job.dueDate);
    const location = job.deliveryLocation ? `${job.deliveryLocation.city}, ${job.deliveryLocation.state}` : null;
    // Once logged in, straight to the job on their platform
    const loginHref = `${ARTISAN_LOGIN_URL}?next=${encodeURIComponent(`${MANUFACTURER_JOBS_URL}/${job.id}`)}`;

    return (
        <>
            <script
                type="application/ld+json"
                // The job's own text is escaped by toJsonLd
                dangerouslySetInnerHTML={{ __html: toJsonLd(getJobPostingSchema(job, url)) }}
            />

            <SectionWrapper containerClassName="flex flex-col gap-8">
                <Link href={OPEN_JOBS_URL} className="inline-flex w-fit items-center gap-2 text-sm text-mist-700 hover:text-primary-800">
                    <ArrowLeft className="size-4" aria-hidden />
                    All open jobs
                </Link>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
                    <article className="flex min-w-0 flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <span className="text-sm text-mist-600">
                                {getJobCategoryLabel(job.category)} · Posted {getTimeAgoLabel(new Date(job.postedAt))} · {job.code}
                            </span>
                            <h1 className="text-3xl tracking-tight text-pretty md:text-5xl">{job.title}</h1>
                        </div>
                        <div className="relative aspect-4/3 w-full overflow-hidden rounded-[10px] bg-mist-200 md:aspect-video">
                            <Image
                                src={job.image?.url || DEFAULT_IMAGE}
                                alt={job.image?.url ? job.title : ""}
                                fill
                                sizes="(min-width: 1024px) 60vw, 100vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <h2 className="text-xl font-medium">About the job</h2>
                            <p className="text-base font-light whitespace-pre-line text-mist-800">{job.description}</p>
                        </div>
                    </article>

                    <aside className="flex h-fit flex-col gap-6 rounded-[10px] border border-border bg-white p-6 lg:sticky lg:top-24">
                        <dl className="flex flex-col gap-4">
                            <Detail icon={<Wallet className="size-5" aria-hidden />} label="You're paid">
                                {formatPrice(fromKobo(job.amountKobo))}, in stages as each is approved
                            </Detail>
                            <Detail icon={<CalendarDays className="size-5" aria-hidden />} label="Runs for">
                                {formatShortDuration(start, due)}, due {formatOrdinalDate(due)}
                            </Detail>
                            <Detail icon={<Tag className="size-5" aria-hidden />} label="Category">
                                {getJobCategoryLabel(job.category)}
                            </Detail>
                            {location && (
                                <Detail icon={<MapPin className="size-5" aria-hidden />} label="Delivery to">
                                    {location}
                                </Detail>
                            )}
                        </dl>
                        <div className="flex flex-col gap-3 border-t border-border pt-6">
                            <Link href={ARTISAN_SIGNUP_URL} className={`${WEBSITE_PRIMARY_BUTTON} w-full`}>
                                Create a profile to apply
                            </Link>
                            <Link href={loginHref} className={`${WEBSITE_OUTLINE_BUTTON} w-full`}>
                                Already on MANDE? Log in
                            </Link>
                        </div>
                    </aside>
                </div>
            </SectionWrapper>

            <CtaBand title="More jobs like this, every week." secondaryLink={{ label: "Read the FAQs", href: FAQ_URL }} />
        </>
    );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
    return (
        <div className="flex gap-3">
            <span className="mt-0.5 text-primary-800">{icon}</span>
            <div className="flex flex-col gap-0.5">
                <dt className="text-sm text-mist-600">{label}</dt>
                <dd className="text-base">{children}</dd>
            </div>
        </div>
    );
}
