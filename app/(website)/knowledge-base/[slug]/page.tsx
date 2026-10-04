import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KnowledgeBaseArticleView from "@/components/mainWebsite/knowledgeBasePage/articleView";
import { getKnowledgeBaseArticle, getKnowledgeBaseSlugs } from "@/lib/cms/knowledgeBase";
import { getKnowledgeBaseArticleUrl } from "@/constant/navigation";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

// Built ahead for the articles in the CMS when the site is built; one added
// later is built on its first visit, and an unknown slug is a 404
export async function generateStaticParams() {
    const articles = await getKnowledgeBaseSlugs().catch(() => []);
    return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getKnowledgeBaseArticle(slug).catch(() => null);
    return article
        ? pageMetadata({ title: `${article.title} | MANDE`, description: article.summary, path: getKnowledgeBaseArticleUrl(slug) })
        : {};
}

export default async function KnowledgeBaseArticleRoute({ params }: Props) {
    const article = await getKnowledgeBaseArticle((await params).slug);
    if (!article) notFound();
    return <KnowledgeBaseArticleView article={article} />;
}
