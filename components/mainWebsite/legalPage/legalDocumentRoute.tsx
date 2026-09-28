import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocument, getLegalDocuments } from "@/lib/cms/legal";
import LegalDocumentView from "./legalDocumentView";

/** A legal document's page — the terms, the privacy policy, and the rest under /legals. Not found for an unknown slug. */
export default async function LegalDocumentRoute({ slug }: { slug: string }) {
    const document = await getLegalDocument(slug);
    if (!document) notFound();
    const otherDocuments = (await getLegalDocuments()).filter((other) => other.slug !== slug);

    return <LegalDocumentView document={document} otherDocuments={otherDocuments} />;
}

/** Its tab title and search description, from the CMS. */
export async function getLegalDocumentMetadata(slug: string): Promise<Metadata> {
    const document = await getLegalDocument(slug);
    return document ? { title: `${document.title} | MANDE`, description: document.summary } : {};
}
