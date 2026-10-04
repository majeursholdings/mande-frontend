import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocument, getLegalDocuments } from "@/lib/cms/legal";
import LegalDocumentView from "./legalDocumentView";
import { getLegalDocumentUrl } from "@/constant/navigation";
import { pageMetadata } from "@/lib/seo";

/** A legal document's page — the terms, the privacy policy, and the rest under /legals. Not found for an unknown slug. */
export default async function LegalDocumentRoute({ slug }: { slug: string }) {
    const document = await getLegalDocument(slug);
    if (!document) notFound();
    // The rest are a nicety: without them the page still shows the document
    const otherDocuments = (await getLegalDocuments().catch(() => [])).filter((other) => other.slug !== slug);

    return <LegalDocumentView document={document} otherDocuments={otherDocuments} />;
}

/** Its tab title and search description, from the CMS. */
export async function getLegalDocumentMetadata(slug: string): Promise<Metadata> {
    const document = await getLegalDocument(slug).catch(() => null);
    return document
        ? pageMetadata({ title: `${document.title} | MANDE`, description: document.summary, path: getLegalDocumentUrl(slug) })
        : {};
}
