"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL, mainmenu } from "@/constant/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

function MobileMenuItem({
    item,
    pathname,
}: {
    item: (typeof mainmenu)[number];
    pathname: string;
}) {
    const hasSubMenu = Boolean(item.subMenu && item.subMenu.length > 0);
    const isChildActive = Boolean(item.subMenu?.some((sub) => sub.href === pathname));
    const isActive = item.href === pathname || isChildActive;
    const [isOpen, setIsOpen] = useState(isChildActive);

    if (hasSubMenu) {
        return (
            <div className="flex flex-col">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className={`flex items-center justify-between w-full text-left text-base font-normal px-3 py-2 rounded-none transition-colors duration-200 cursor-pointer hover:bg-mist-800/50 hover:text-primary-200 ${
                        isActive ? "text-primary-300" : "text-mist-100"
                    }`}
                    aria-expanded={isOpen}
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
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden flex flex-col pl-4 space-y-1"
                        >
                            {item.subMenu.map((subItem) => {
                                const isSubActive = subItem.href === pathname;
                                return (
                                    <Link
                                        key={subItem.label}
                                        href={subItem.href as string}
                                        title={subItem.label}
                                        className={`block text-sm font-normal px-3 py-2 rounded-none transition-colors duration-200 hover:bg-mist-800/50 hover:text-primary-200 ${
                                            isSubActive
                                                ? "text-primary-300 font-medium bg-mist-800/30"
                                                : "text-mist-200"
                                        }`}
                                    >
                                        {subItem.label}
                                    </Link>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <Link
            href={item.href || "#"}
            title={item.label}
            className={`text-base font-normal px-3 py-2 rounded-none transition-colors duration-200 hover:bg-mist-800/50 hover:text-primary-200 ${
                isActive ? "text-primary-300" : "text-mist-100"
            }`}
        >
            {item.label}
        </Link>
    );
}

export default function MobileMenu() {
    const pathname = usePathname();

    return (
        <Sheet>
            <SheetTrigger>
                <div className="flex items-center cursor-pointer">
                    <Menu className="text-mist-100 size-6" />
                </div>
            </SheetTrigger>
            <SheetContent className="bg-green-950 text-mist-100 w-72 flex flex-col justify-between h-full p-0">
                <SheetHeader className="border-b border-mist-800 p-4">
                    <SheetTitle className="text-xl font-bold text-mist-100">
                        Navigation
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex-1 flex flex-col justify-center space-y-2 p-4 overflow-y-auto">
                    {mainmenu.map((item) => (
                        <MobileMenuItem key={item.label} item={item} pathname={pathname} />
                    ))}
                </nav>

                <SheetFooter className="border-t border-mist-800 p-4 mt-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            href={ARTISAN_LOGIN_URL}
                            title="Log in"
                            className="text-mist-100 text-base font-normal hover:text-primary-200 transition-all duration-300"
                        >
                            Log in
                        </Link>
                        <Link
                            href={ARTISAN_SIGNUP_URL}
                            title="Sign up"
                            className="w-fit border rounded-none px-5 py-1 text-mist-100 text-base font-normal bg-transparent hover:border-primary-200 hover:text-mist-800 hover:bg-primary-200 transition-colors duration-300"
                        >
                            Sign up
                        </Link>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
