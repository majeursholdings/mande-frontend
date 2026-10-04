import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ServicesPage from "@/components/mainWebsite/servicesPage";

export const metadata: Metadata = pageMetadata({
    title: "Services | MANDE",
    description:
        "Paid furniture jobs, your MANDE wallet, a dedicated officer, and time on the country's top furniture machines at our Lagos factory.",
    path: "/mande-services",
});

export default function ServicesRoute() {
    return <ServicesPage />;
}
