import type { ReactNode } from "react";

/**
 * The band at the top of a website page — the homepage hero's grey, with a
 * small line over the page's title, a sentence or two under it, and
 * optional actions.
 */
export default function PageHero({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: ReactNode;
    /** Under the description, e.g. buttons. */
    children?: ReactNode;
}) {
    return (
        <section className="bg-mist-200 px-2.5 py-12.5 md:py-20">
            <div className="container mx-auto flex flex-col items-center gap-5 text-center text-pretty">
                <span className="text-lg font-medium">{eyebrow}</span>
                <h1 className="max-w-200 text-3xl tracking-tight md:text-5xl">{title}</h1>
                <p className="max-w-160 text-base font-light md:text-lg">{description}</p>
                {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{children}</div>}
            </div>
        </section>
    );
}
