import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import OpenJobsPage from "@/components/mainWebsite/openJobsPage";

export const metadata: Metadata = pageMetadata({
    title: "Open furniture jobs | MANDE",
    description:
        "Browse real furniture jobs on MANDE, paid in stages as you build. Create a profile to apply.",
    path: "/open-jobs",
});

export default function OpenJobsRoute() {
    return <OpenJobsPage />;
}
