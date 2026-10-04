import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/mainWebsite/navigations/footer";
import Header from "@/components/mainWebsite/navigations/header";
import OfferBar from "@/components/mainWebsite/navigations/offerBar";
import { MenuIcon } from "@/components/mainWebsite/navigations/menuIcons";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "@/components/mainWebsite/common/buttonStyles";
import { COMMUNITY_URL, CONTACT_URL, FAQ_URL, OPEN_JOBS_URL, SERVICES_URL } from "@/constant/navigation";

const QUICK_LINKS: { label: string; description: string; href: string }[] = [
    { label: "Open Jobs", description: "Real furniture jobs, paid in stages", href: OPEN_JOBS_URL },
    { label: "Services", description: "Machine access at our Lagos factory", href: SERVICES_URL },
    { label: "Community", description: "Meet other makers on MANDE", href: COMMUNITY_URL },
    { label: "FAQs", description: "Jobs, payments, plans and your account", href: FAQ_URL },
];

// ─────────────────────────────────────────────────────────────────────────────
// Not found — any address the app doesn't have, and notFound() on the
// website. Rendered in the root layout, so it brings the website's header and
// footer itself: the error, a way home, and the pages people usually want.
// ─────────────────────────────────────────────────────────────────────────────

export default function NotFound() {
    return (
        <>
            <Suspense fallback={null}>
                <OfferBar />
            </Suspense>
            <Header />
            <main className="flex flex-1 flex-col">
                <section className="flex flex-1 items-center bg-mist-200 px-2.5 py-16 md:py-24">
                    <div className="container mx-auto flex flex-col items-center gap-12 text-center">
                        <div className="flex flex-col items-center gap-5 text-pretty">
                            <span className="text-7xl font-semibold tracking-tight text-primary-800 md:text-9xl">404</span>
                            <h1 className="max-w-175 text-3xl tracking-tight md:text-5xl">We couldn&apos;t find that page.</h1>
                            <p className="max-w-140 text-base font-light md:text-lg">
                                The link may be broken, or the page may have moved. Here are a few good places to start.
                            </p>
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                                <Link href="/" className={WEBSITE_PRIMARY_BUTTON}>
                                    Go to the homepage
                                </Link>
                                <Link href={CONTACT_URL} className={WEBSITE_OUTLINE_BUTTON}>
                                    Contact us
                                </Link>
                            </div>
                        </div>

                        <ul className="grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="group flex h-full items-center gap-4 rounded-[10px] bg-white p-5 transition-colors duration-300 hover:bg-primary-50"
                                    >
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                            <MenuIcon item={link} className="size-5" />
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="text-base font-medium">{link.label}</span>
                                            <span className="text-sm font-light text-mist-600">{link.description}</span>
                                        </span>
                                        <ArrowRight
                                            className="size-4 shrink-0 text-primary-800 transition-transform duration-300 group-hover:translate-x-1"
                                            aria-hidden
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
