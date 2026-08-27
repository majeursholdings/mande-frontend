"use client";

import { useState } from "react";
import Logo from "./logo";
import Link from "next/link";
import MobileMenu from "./mobileMenu";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL, mainmenu } from "@/constant/navigation";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function Header() {

    const pathname = usePathname();

    return (
        <header className="sticky top-0 right-0 left-0 z-50 px-2.5 sm:px-6 lg:px-8 py-3 bg-green-950 w-full">
            <div className="container mx-auto flex items-center justify-between gap-5">
                <div>
                    <Logo/>
                </div>

                <nav className="hidden md:flex items-center gap-5 justify-center">
                    {mainmenu.map((item) => {
                        const hasSubMenu = Boolean(item.subMenu && item.subMenu.length > 0);
                        const isChildActive = Boolean(item.subMenu?.some((sub) => sub.href === pathname));
                        const isActive = item.href === pathname || isChildActive;

                        if (!hasSubMenu) {
                            return (
                                <Link 
                                    key={item.label}
                                    href={item.href as string}
                                    title={item.label}
                                    className={`text-base font-normal hover:text-primary-200 transition-all duration-300 ${isActive ? "text-primary-300" : "text-mist-100"}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        }

                        return (
                            <HeaderDropdownItem 
                                key={item.label}
                                item={item}
                                pathname={pathname}
                                isActive={isActive}
                            />
                        );
                    })}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Link 
                        href={ARTISAN_LOGIN_URL}
                        title={'Log in'}
                        className="text-mist-100 text-base font-normal hover:text-primary-200 transition-all duration-300"
                    >
                        Log in
                    </Link>
                    <Link 
                        href={ARTISAN_SIGNUP_URL}
                        title={'Sign up'}
                        className="border rounded-xs px-5 py-1 text-mist-100 text-base font-normal bg-transparent hover:border-primary-200 hover:text-mist-800 hover:bg-primary-200 transition-colors duration-300"
                    >
                        Sign up
                    </Link>
                </div>

                <div className="flex md:hidden">
                    <MobileMenu/>
                </div>
            </div>
        </header>
    )
}

function HeaderDropdownItem({
    item,
    pathname,
    isActive,
}: {
    item: (typeof mainmenu)[number];
    pathname: string;
    isActive: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative py-2"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 text-base font-normal cursor-pointer transition-all duration-300 hover:text-primary-200 ${
                    isActive ? "text-primary-300" : "text-mist-100"
                }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={item.label}
            >
                <span>{item.label}</span>
                <ChevronDown
                    className={`size-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary-200" : ""
                    }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && item.subMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full pt-1.5 z-50 min-w-56"
                    >
                        <div className="bg-primary-200 border border-primary-300 rounded-xs shadow-xl overflow-hidden">
                            {item.subMenu.map((subItem) => {
                                const isSubActive = subItem.href === pathname;
                                return (
                                    <Link
                                        key={subItem.label}
                                        href={subItem.href as string}
                                        title={subItem.label}
                                        onClick={() => setIsOpen(false)}
                                        className={`block px-4 py-2.5 text-sm transition-colors duration-300 hover:bg-green-950 hover:text-primary-200 ${
                                            isSubActive
                                                ? "text-primary-950 font-medium bg-green-500"
                                                : "text-mist-950"
                                        }`}
                                    >
                                        {subItem.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}