import { Suspense } from "react";
import { BadgeCheck, ClipboardList, UserRoundPlus, type LucideIcon } from "lucide-react";
import { FAQ_URL } from "@/constant/navigation";
import CtaBand from "../common/ctaBand";
import PageHero from "../common/pageHero";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import NoOpenJobs from "../common/noOpenJobs";
import { getWebsiteOpenJobs } from "@/lib/services/websiteService";
import OpenJobsBrowser from "./openJobsBrowser";

const APPLY_STEPS: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: UserRoundPlus,
        title: "Create your profile",
        description: "Sign up, choose a plan and upload your NIN card. Verification usually takes 1–2 working days.",
    },
    {
        icon: ClipboardList,
        title: "Apply for a job",
        description: "Pick the jobs that suit your workshop. A project lead reviews your application and assigns the job.",
    },
    {
        icon: BadgeCheck,
        title: "Build and get paid",
        description: "Send photos at each stage of the build. You're paid as each one is approved.",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Open Jobs — every job open to applications, to search, filter and sort;
// then how applying works, and the sign-up band. Applying needs a MANDE
// profile, so each card leads to sign-up.
// ─────────────────────────────────────────────────────────────────────────────

export default function OpenJobsPage() {
    return (
        <>
            <PageHero
                eyebrow="Open jobs"
                title="Find your next furniture job."
                description="Real furniture projects, paid in stages as you build. Apply with a MANDE profile: your pay is protected from the first cut."
            />

            <SectionWrapper>
                <Suspense fallback={<OpenJobsBrowser jobs={[]} loading />}>
                    <OpenJobs />
                </Suspense>
            </SectionWrapper>

            <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
                <SectionHeading as="h2" className="max-w-175">
                    How applying works.
                </SectionHeading>
                <ol className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-8">
                    {APPLY_STEPS.map(({ icon: Icon, title, description }, index) => (
                        <li key={title} className="flex flex-col gap-4 rounded-[10px] bg-white p-6 lg:p-8">
                            <div className="flex items-center justify-between">
                                <span className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                                </span>
                                <span className="font-mono text-sm font-semibold text-primary-700">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </div>
                            <h3 className="text-xl font-medium">{title}</h3>
                            <p className="text-base font-light text-mist-700">{description}</p>
                        </li>
                    ))}
                </ol>
            </SectionWrapper>

            <CtaBand
                title="Your next job could be one of these."
                secondaryLink={{ label: "Read the FAQs", href: FAQ_URL }}
            />
        </>
    );
}

/** Every open job, streamed in under the hero. */
async function OpenJobs() {
    const jobs = await getWebsiteOpenJobs();
    return jobs && jobs.length > 0 ? <OpenJobsBrowser jobs={jobs} /> : <NoOpenJobs unavailable={jobs === null} />;
}
