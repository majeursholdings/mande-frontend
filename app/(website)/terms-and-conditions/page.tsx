import type { Metadata } from "next";
import LegalDocumentRoute, { getLegalDocumentMetadata } from "@/components/mainWebsite/legalPage/legalDocumentRoute";

const SLUG = "terms-and-conditions";

export async function generateMetadata(): Promise<Metadata> {
    return getLegalDocumentMetadata(SLUG);
}

export default function TermsAndConditionsRoute() {
    return <LegalDocumentRoute slug={SLUG} />;
}
