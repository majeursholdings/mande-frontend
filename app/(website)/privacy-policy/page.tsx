import type { Metadata } from "next";
import LegalDocumentRoute, { getLegalDocumentMetadata } from "@/components/mainWebsite/legalPage/legalDocumentRoute";

const SLUG = "privacy-policy";

export async function generateMetadata(): Promise<Metadata> {
    return getLegalDocumentMetadata(SLUG);
}

export default function PrivacyPolicyRoute() {
    return <LegalDocumentRoute slug={SLUG} />;
}
