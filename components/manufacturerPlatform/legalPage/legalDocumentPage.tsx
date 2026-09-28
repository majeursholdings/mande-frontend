import Link from "next/link";
import { formatOrdinalDate } from "@/lib/date";
import type { LegalDocument } from "@/lib/cms/legal";
import { LegalContents, LegalDocumentBody } from "@/components/common/legalDocument";
import { MANUFACTURER_LEGAL_BACK_LINK, MANUFACTURER_SUPPORT_URL } from "@/constant/manufacturer";
import PageHeader from "../pageHeader";

export default function LegalDocumentPage({ document }: { document: LegalDocument }) {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={document.title}
                description={`Last updated ${formatOrdinalDate(new Date(document.updatedAt))}`}
                backLink={MANUFACTURER_LEGAL_BACK_LINK}
            />

            <div className="flex gap-12">
                <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-8">
                    <LegalDocumentBody document={document} />
                    <p className="border-t border-border pt-6 text-sm font-text text-mist-500">
                        Questions about this policy?{" "}
                        <Link
                            href={MANUFACTURER_SUPPORT_URL}
                            className="font-medium text-secondary-700 hover:underline"
                        >
                            Talk to support
                        </Link>
                    </p>
                </div>

                <LegalContents document={document} className="hidden w-56 shrink-0 xl:block" />
            </div>
        </div>
    );
}
