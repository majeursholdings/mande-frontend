import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatOrdinalDate } from "@/lib/date";
import type { KnowledgeBaseArticle } from "@/lib/cms/knowledgeBase";
import { getRichTextHeadings } from "@/lib/cms/richText";
import { RichText, RichTextContents } from "@/components/common/richText";
import { KNOWLEDGE_BASE_URL } from "@/constant/navigation";
import SectionWrapper from "../common/sectionWrapper";
import StillHaveAQuestion from "../common/stillHaveAQuestion";
import ArticleLink from "./articleLink";

// ─────────────────────────────────────────────────────────────────────────────
// A help article — its category, title and summary, the steps with an "On
// this page" list beside them from lg, then related articles and who to ask.
// ─────────────────────────────────────────────────────────────────────────────

export default function KnowledgeBaseArticleView({ article }: { article: KnowledgeBaseArticle }) {
    return (
        <>
            <section className="bg-mist-200 px-2.5 py-12.5 md:py-16">
                <div className="container mx-auto flex flex-col gap-4">
                    <nav aria-label="Breadcrumb">
                        <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-primary-800">
                            <li>
                                <Link href={KNOWLEDGE_BASE_URL} className="inline-flex items-center gap-1.5 hover:text-primary-950">
                                    <ArrowLeft className="size-4" aria-hidden />
                                    Knowledge base
                                </Link>
                            </li>
                            {article.category && (
                                <li className="flex items-center gap-1.5">
                                    <span aria-hidden className="text-mist-500">/</span>
                                    <Link href={`${KNOWLEDGE_BASE_URL}#${article.category.slug}`} className="hover:text-primary-950">
                                        {article.category.title}
                                    </Link>
                                </li>
                            )}
                        </ol>
                    </nav>
                    <h1 className="max-w-200 text-3xl tracking-tight text-pretty md:text-5xl">{article.title}</h1>
                    <p className="max-w-160 text-base font-light md:text-lg">{article.summary}</p>
                    <p className="text-sm font-light text-mist-700">Updated {formatOrdinalDate(new Date(article.updatedAt))}</p>
                </div>
            </section>

            <SectionWrapper containerClassName="flex gap-16">
                <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-12">
                    <RichText value={article.body} />

                    {article.related.length > 0 && (
                        <section aria-labelledby="related-articles" className="flex flex-col gap-4 border-t border-border pt-8">
                            <h2 id="related-articles" className="text-xl font-medium">
                                Related articles
                            </h2>
                            <ul className="flex flex-col divide-y divide-border rounded-[10px] border border-border bg-white">
                                {article.related.map((related) => (
                                    <li key={related.slug}>
                                        <ArticleLink {...related} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <StillHaveAQuestion />
                </div>

                <RichTextContents headings={getRichTextHeadings(article.body)} className="hidden w-60 shrink-0 lg:block" />
            </SectionWrapper>
        </>
    );
}
