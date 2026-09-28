import type { Metadata } from "next";
import LegalIndexPage from "@/components/mainWebsite/legalPage";
import { getLegalDocuments } from "@/lib/cms/legal";

export const metadata: Metadata = {
    title: "Legal information | MANDE",
    description: "MANDE's terms and conditions, privacy policy, payment policy and subscription policy.",
};

export default async function LegalsRoute() {
    return <LegalIndexPage documents={await getLegalDocuments()} />;
}
