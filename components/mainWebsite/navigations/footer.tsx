import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { footerLegalMenu, footerMenu } from "@/constant/navigation";
import { CONTACT_DETAILS } from "@/constant/website";
import Logo from "./logo";

const FOOTER_LINK_CLASS =
    "inline-flex items-center gap-1 text-sm font-light text-mist-300 transition-colors duration-200 hover:text-white";

/**
 * The website footer: MANDE in a line with how to reach the team, the links in three columns (for makers, MANDE, help), and a bottom bar
 * with the copyright and the legal pages.
 */
export default function Footer() {
    return (
        <footer className="bg-mist-950 px-2.5 pt-12 pb-6 md:pt-16">
            <div className="container mx-auto flex flex-col gap-12">
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:gap-12">
                    <div className="col-span-2 flex flex-col gap-5 md:col-span-4 lg:col-span-1">
                        <Link href="/" aria-label="MANDE, go to the homepage" className="w-28">
                            <Logo />
                        </Link>
                        <p className="max-w-90 text-sm font-light text-mist-300">
                            The platform for furniture makers: paid jobs, top furniture machines, loans to grow and a community
                            behind you.
                        </p>
                        <div className="flex flex-col gap-1 text-sm font-light text-mist-300">
                            <a
                                href={`mailto:${CONTACT_DETAILS.email}`}
                                className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-white"
                            >
                                <Mail className="size-4" strokeWidth={1.75} aria-hidden />
                                {CONTACT_DETAILS.email}
                            </a>
                            <span className="text-mist-400">{CONTACT_DETAILS.hours}</span>
                        </div>
                    </div>

                    {footerMenu.map((group) => (
                        <nav key={group.title} aria-label={group.title} className="flex flex-col gap-4">
                            <p className="text-sm font-medium text-white">{group.title}</p>
                            <ul className="flex flex-col gap-3">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        {link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={FOOTER_LINK_CLASS}
                                            >
                                                {link.label}
                                                <ArrowUpRight className="size-3.5" aria-hidden />
                                                <span className="sr-only">(opens in a new tab)</span>
                                            </a>
                                        ) : (
                                            <Link href={link.href ?? "/"} className={FOOTER_LINK_CLASS}>
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className="flex flex-col-reverse gap-4 border-t border-mist-800 pt-6 md:flex-row md:items-center md:justify-between">
                    <span className="text-xs text-mist-400">© 2026 Majeurs Holdings. All Rights Reserved</span>
                    <nav aria-label="Legal">
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                            {footerLegalMenu.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href ?? "/"}
                                        className="text-xs text-mist-400 transition-colors duration-200 hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
