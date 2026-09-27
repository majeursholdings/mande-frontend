import type { Metadata } from "next";
import AboutPage from "@/components/mainWebsite/aboutPage";

export const metadata: Metadata = {
    title: "About MANDE",
    description: "MANDE is a platform for furniture makers — find real jobs, get paid in stages as you build, and grow your business.",
};

export default function AboutMandeRoute() {
    return <AboutPage />;
}
