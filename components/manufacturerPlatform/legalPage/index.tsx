import { FileText } from "lucide-react";
import { formatOrdinalDate } from "@/lib/date";
import type { LegalDocumentSummary } from "@/lib/cms/legal";
import { MANUFACTURER_LEGAL_URL, MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import LinkList from "../linkList";
import PageHeader from "../pageHeader";

export default function ManufacturerLegalPage({
    documents,
}: {
    documents: LegalDocumentSummary[];
}) {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Legal information"
                description="The policies that apply when you use Mande."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            {documents.length > 0 ? (
                <LinkList
                    className="max-w-2xl"
                    items={documents.map((document) => ({
                        href: `${MANUFACTURER_LEGAL_URL}/${document.slug}`,
                        icon: FileText,
                        title: document.title,
                        description: document.summary,
                        meta: `Updated ${formatOrdinalDate(new Date(document.updatedAt))}`,
                    }))}
                />
            ) : (
                <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Our legal documents will appear here."
                />
            )}
        </div>
    );
}
