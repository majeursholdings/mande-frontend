import { footerMenu } from "@/constant/navigation";
import Logo from "./logo";
import Link from "next/link";


export default function Footer() {
    return (
        <footer className="bg-mist-950 pt-10 pb-5 md:pt-15 px-2.5">
            <div className="container mx-auto space-y-10">
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 md:gap-5 items-center justify-center">
                        {footerMenu.map((item) => (
                            <Link
                                href={item.href || "#"}
                                key={item.label}
                                className="text-sm uppercase tracking-wide font-medium text-mist-300"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="w-full max-w-150 mx-auto border-t border-mist-900/70" />
                    <div className="max-w-150 mx-auto text-center">
                        <span className="text-sm text-mist-300">
                            MANDE is a unique global platform for furniture
                            manufacters and woodmen and showcasing their best
                            woodworks and increase their busiess revenue,
                            increase profits, get easy access to top machines
                            and grow exponatially.
                        </span>
                    </div>
                </div>
                <div className="w-full border-t border-mist-800" />
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                    <div className="max-w-25">
                        <Logo />
                    </div>
                    <div className="">
                        <span className="text-xs text-mist-300">
                            © 2026 Majeurs Holdings. All Rights Reserved
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}