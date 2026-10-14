import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import AboutPage from "@/components/mainWebsite/aboutPage";

export const metadata: Metadata = pageMetadata({
    title: "About MANDE",
    description:
        "MANDE is the platform for furniture makers: real paid jobs, payment in stages as you build, top machines at our Lagos factory, loans to grow your workshop and a community of makers.",
    path: "/about-mande",
});

export default function AboutMandeRoute() {
    return <AboutPage />;
}
