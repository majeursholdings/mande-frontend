import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import HomePage from "@/components/mainWebsite/homePage";

export const metadata: Metadata = pageMetadata({
    title: "MANDE | Grow your furniture business",
    description:
        "Find real furniture jobs, get paid as each stage is approved, and build on the country's top machines at our Lagos factory.",
    path: "/",
});

export default function Home() {
    // The website layout already wraps the page in <main>
    return <HomePage />;
}
