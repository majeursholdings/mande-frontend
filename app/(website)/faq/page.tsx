import type { Metadata } from "next";
import FAQsPage from "@/components/mainWebsite/FAQsPage";

export const metadata: Metadata = {
    title: "FAQs | MANDE",
    description: "Answers about joining MANDE, taking on furniture jobs, getting paid in stages and choosing a plan.",
};

export default function FAQRoute() {
    return <FAQsPage />;
}
