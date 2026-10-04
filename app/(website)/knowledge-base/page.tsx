import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import KnowledgeBasePage from "@/components/mainWebsite/knowledgeBasePage";

export const metadata: Metadata = pageMetadata({
    title: "Knowledge base | MANDE",
    description:
        "Step-by-step guides to using MANDE: getting verified, taking on furniture jobs, getting paid and managing your plan.",
    path: "/knowledge-base",
});

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function KnowledgeBaseRoute({ searchParams }: Props) {
    const { q } = await searchParams;
    const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? "";
    return <KnowledgeBasePage query={query} />;
}
