import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BlogPage from "@/components/mainWebsite/blogPage";

export const metadata: Metadata = pageMetadata({
    title: "Blog | MANDE",
    description: "News from MANDE, practical guides for furniture makers, and stories from the workshops building with us.",
    path: "/blog",
});

type Props = { searchParams: Promise<{ page?: string | string[]; category?: string | string[] }> };

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default async function BlogRoute({ searchParams }: Props) {
    const params = await searchParams;
    const page = Math.max(1, Math.min(1000, Number.parseInt(first(params.page) ?? "1", 10) || 1));
    const category = first(params.category)?.trim() || undefined;
    return <BlogPage page={page} category={category} />;
}
