import type { Metadata } from "next";
import HomePage from "@/components/mainWebsite/homePage";

export const metadata: Metadata = {
    title: "MANDE | Grow your furniture business",
    description:
        "Find real furniture jobs, get paid as each stage is approved, and build on the country's top machines at our Lagos factory.",
};

export default function Home() {
    // The website layout already wraps the page in <main>
    return <HomePage />;
}
