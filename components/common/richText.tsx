import Image from "next/image";
import Link from "next/link";
import { Info, TriangleAlert } from "lucide-react";
import { PortableText, toPlainText, type PortableTextComponents } from "@portabletext/react";
import { cn } from "@/lib/utils";
import { cmsImageUrl } from "@/lib/cms/client";
import { toAnchor, type RichText as RichTextValue, type RichTextCallout, type RichTextHeading, type RichTextImage } from "@/lib/cms/richText";

// ─────────────────────────────────────────────────────────────────────────────
// Rich text from the CMS (legal documents, help articles, blog posts) and its
// "On this page" list. The same content in the manufacturer dashboard and on
// the website, styled for each ("website" is larger and lighter, like the
// site's other pages).
// ─────────────────────────────────────────────────────────────────────────────

type Variant = "dashboard" | "website";

const STYLES = {
    website: {
        h2: "text-2xl tracking-tight md:text-3xl scroll-mt-24 mt-6 first:mt-0",
        h3: "text-xl font-medium scroll-mt-24 mt-2",
        text: "text-base leading-8 font-light text-mist-800",
        link: "font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950",
    },
    dashboard: {
        h2: "text-lg font-semibold font-text text-mist-950 scroll-mt-28 mt-4 first:mt-0",
        h3: "text-base font-semibold font-text text-mist-900 scroll-mt-28",
        text: "text-sm leading-7 font-text text-mist-700",
        link: "font-medium text-secondary-700 hover:underline",
    },
};

function getComponents(variant: Variant): PortableTextComponents {
    const styles = STYLES[variant];
    return {
        block: {
            normal: ({ children }) => <p className={styles.text}>{children}</p>,
            h2: ({ children, value }) => (
                <h2 id={toAnchor(toPlainText(value))} className={styles.h2}>
                    {children}
                </h2>
            ),
            h3: ({ children, value }) => (
                <h3 id={toAnchor(toPlainText(value))} className={styles.h3}>
                    {children}
                </h3>
            ),
            blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary-500 pl-5 text-xl leading-8 font-light text-mist-900 italic">
                    {children}
                </blockquote>
            ),
        },
        list: {
            bullet: ({ children }) => <ul className={cn(styles.text, "flex list-disc flex-col gap-2 pl-6")}>{children}</ul>,
            number: ({ children }) => <ol className={cn(styles.text, "flex list-decimal flex-col gap-2 pl-6")}>{children}</ol>,
        },
        marks: {
            strong: ({ children }) => <strong className="font-medium text-mist-950">{children}</strong>,
            link: ({ children, value }) => {
                const href: string = value?.href ?? "";
                return href.startsWith("/") ? (
                    <Link href={href} className={styles.link}>
                        {children}
                    </Link>
                ) : (
                    <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                );
            },
        },
        types: {
            bodyImage: ({ value }: { value: RichTextImage }) => <RichTextPicture image={value} />,
            callout: ({ value }: { value: RichTextCallout }) => <Callout callout={value} />,
        },
    };
}

function RichTextPicture({ image }: { image: RichTextImage }) {
    if (!image.asset) return null;
    const width = 1200;
    const height = image.dimensions ? Math.round((width * image.dimensions.height) / image.dimensions.width) : 800;
    return (
        <figure className="my-2 flex flex-col gap-2">
            <Image
                src={cmsImageUrl(image).width(width).url()}
                alt={image.alt ?? ""}
                width={width}
                height={height}
                sizes="(min-width: 768px) 768px, 100vw"
                placeholder={image.lqip ? "blur" : "empty"}
                blurDataURL={image.lqip ?? undefined}
                className="h-auto w-full rounded-[10px]"
            />
            {image.caption && <figcaption className="text-sm font-light text-mist-600">{image.caption}</figcaption>}
        </figure>
    );
}

function Callout({ callout }: { callout: RichTextCallout }) {
    const isImportant = callout.tone === "important";
    const Icon = isImportant ? TriangleAlert : Info;
    return (
        <aside
            className={cn(
                "flex gap-3 rounded-[10px] border p-4 md:p-5",
                isImportant ? "border-warning-300 bg-warning-50" : "border-primary-200 bg-primary-50",
            )}
        >
            <Icon
                className={cn("mt-1 size-5 shrink-0", isImportant ? "text-warning-700" : "text-primary-800")}
                strokeWidth={1.75}
                aria-hidden
            />
            <p className="text-base leading-7 font-light text-mist-900">
                <span className="sr-only">{isImportant ? "Important: " : "Tip: "}</span>
                {callout.text}
            </p>
        </aside>
    );
}

export function RichText({ value, variant = "website" }: { value: RichTextValue; variant?: Variant }) {
    return (
        <article className={cn("flex flex-col", variant === "website" ? "gap-5" : "gap-4")}>
            <PortableText value={value} components={getComponents(variant)} />
        </article>
    );
}

/** Links to each section, sticky beside the text where there's room. Nothing when there are no sections. */
export function RichTextContents({
    headings,
    variant = "website",
    className,
}: {
    headings: RichTextHeading[];
    variant?: Variant;
    className?: string;
}) {
    if (headings.length === 0) return null;
    const isWebsite = variant === "website";
    return (
        <nav aria-label="On this page" className={className}>
            <div className={cn("sticky flex flex-col gap-3", isWebsite ? "top-24" : "top-28")}>
                <span className="text-xs font-semibold font-text uppercase tracking-wide text-mist-500">On this page</span>
                <ul className="flex flex-col gap-2 border-l border-border">
                    {headings.map((heading) => (
                        <li key={heading.id}>
                            <a
                                href={`#${heading.id}`}
                                className={cn(
                                    "-ml-px block border-l border-transparent pl-3 text-sm font-text",
                                    isWebsite
                                        ? "font-light text-mist-700 hover:border-primary-700 hover:text-primary-950"
                                        : "text-mist-600 hover:border-secondary-600 hover:text-mist-950",
                                )}
                            >
                                {heading.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
