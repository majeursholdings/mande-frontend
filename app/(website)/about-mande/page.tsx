import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import AboutPage from "@/components/mainWebsite/aboutPage";

export const metadata: Metadata = pageMetadata({
    title: "About MANDE",
    description:
        "MANDE is a platform for furniture makers: find real jobs, get paid in stages as you build, and grow your business.",
    path: "/about-mande",
});

export default function AboutMandeRoute() {
    return <AboutPage />;
}
