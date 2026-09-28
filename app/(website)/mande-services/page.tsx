import type { Metadata } from "next";
import ServicesPage from "@/components/mainWebsite/servicesPage";

export const metadata: Metadata = {
    title: "Services | MANDE",
    description: "Paid furniture jobs, your MANDE wallet, a dedicated officer, and time on the country's top furniture machines at our Lagos factory.",
};

export default function ServicesRoute() {
    return <ServicesPage />;
}
