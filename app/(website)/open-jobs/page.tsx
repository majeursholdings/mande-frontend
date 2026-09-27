import type { Metadata } from "next";
import OpenJobsPage from "@/components/mainWebsite/openJobsPage";

export const metadata: Metadata = {
    title: "Open furniture jobs | MANDE",
    description: "Browse real furniture jobs on MANDE — paid in stages as you build. Create a profile to apply.",
};

export default function OpenJobsRoute() {
    return <OpenJobsPage />;
}
