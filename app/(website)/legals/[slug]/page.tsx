import type { Metadata } from "next";
import LegalDocumentRoute, { getLegalDocumentMetadata } from "@/components/mainWebsite/legalPage/legalDocumentRoute";
import { getLegalDocuments } from "@/lib/cms/legal";
import { LEGALS_URL, getLegalDocumentUrl } from "@/constant/navigation";

type Props = { params: Promise<{ slug: string }> };

// Built ahead for the documents that live here, and anything else is a real
// 404 rather than a page. The terms and privacy policy have their own
// addresses — next.config.ts redirects /legals/<their slug> there.
export const dynamicParams = false;

export async function generateStaticParams() {
    const documents = await getLegalDocuments();
    return documents
        .filter((document) => getLegalDocumentUrl(document.slug) === `${LEGALS_URL}/${document.slug}`)
        .map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return getLegalDocumentMetadata((await params).slug);
}

export default async function LegalDocumentPage({ params }: Props) {
    return <LegalDocumentRoute slug={(await params).slug} />;
}
