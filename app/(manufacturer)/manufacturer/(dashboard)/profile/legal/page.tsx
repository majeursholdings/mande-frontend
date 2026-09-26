import ManufacturerLegalPage from "@/components/manufacturerPlatform/legalPage";
import { getLegalDocuments } from "@/lib/cms/legal";

export default async function ManufacturerLegalRoute() {
    const documents = await getLegalDocuments();
    return <ManufacturerLegalPage documents={documents} />;
}
