import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import FAQsPage from "@/components/mainWebsite/FAQsPage";

export const metadata: Metadata = pageMetadata({
    title: "FAQs | MANDE",
    description:
        "Answers about joining MANDE, taking on furniture jobs, getting paid in stages and choosing a plan.",
    path: "/faq",
});

export default function FAQRoute() {
    return <FAQsPage />;
}
