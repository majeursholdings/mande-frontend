import { notFound } from "next/navigation";
import LegalDocumentPage from "@/components/manufacturerPlatform/legalPage/legalDocumentPage";
import { getLegalDocument } from "@/lib/cms/legal";

export default async function ManufacturerLegalDocumentRoute({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const document = await getLegalDocument(slug);
    if (!document) notFound();

    return <LegalDocumentPage document={document} />;
}
