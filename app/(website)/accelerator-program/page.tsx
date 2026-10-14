import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ACCELERATOR_URL } from "@/constant/navigation";
import AcceleratorPage from "@/components/mainWebsite/acceleratorPage";

export const metadata: Metadata = pageMetadata({
    title: "MANDE Accelerator Program",
    description:
        "Loans of up to ₦10 million for furniture makers who rank high on MANDE, with help to get ready, apply and grow your workshop.",
    path: ACCELERATOR_URL,
});

export default function AcceleratorProgramRoute() {
    return <AcceleratorPage />;
}
