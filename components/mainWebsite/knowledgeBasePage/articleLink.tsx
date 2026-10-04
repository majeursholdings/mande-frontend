import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getKnowledgeBaseArticleUrl } from "@/constant/navigation";

/** An article in a list: its title and summary, opening its page. */
export default function ArticleLink({ slug, title, summary, meta }: { slug: string; title: string; summary: string; meta?: string | null }) {
    return (
        <Link
            href={getKnowledgeBaseArticleUrl(slug)}
            className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-mist-100 md:px-6"
        >
            <span className="flex min-w-0 flex-col gap-0.5">
                {meta && <span className="text-xs font-medium tracking-wide text-primary-800 uppercase">{meta}</span>}
                <span className="text-base font-medium">{title}</span>
                <span className="text-sm font-light text-mist-600">{summary}</span>
            </span>
            <ArrowRight
                className="size-4 shrink-0 text-primary-800 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
            />
        </Link>
    );
}
