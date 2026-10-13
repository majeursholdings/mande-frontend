import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ServicesPage from "@/components/mainWebsite/servicesPage";

export const metadata: Metadata = pageMetadata({
    title: "Services | MANDE",
    description:
        "Paid furniture jobs, the country's top furniture machines at our Lagos factory (open to every maker), and loans of up to ₦10 million through the MANDE Accelerator Program.",
    path: "/mande-services",
});

export default function ServicesRoute() {
    return <ServicesPage />;
}
