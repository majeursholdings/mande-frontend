import Link from "next/link";
import { Banknote } from "lucide-react";
import { ACCELERATOR_LOAN_LABEL, ACCELERATOR_PROGRAM_NAME } from "@/constant/accelerator";
import { ACCELERATOR_URL, ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { WEBSITE_ON_DARK_BUTTON, WEBSITE_ON_DARK_OUTLINE_BUTTON } from "./buttonStyles";

/**
 * The MANDE Accelerator Program, in a dark green panel: the most a maker can
 * borrow, what it's for, who can apply and the way to its own page. Shown on the homepage
 * and the Services page.
 */
export default function AcceleratorPanel({ id }: { id?: string }) {
    return (
        <div id={id} className="relative scroll-mt-24 overflow-hidden rounded-[10px] bg-primary-950 text-mist-100">
            {/* A soft glow behind the amount, for depth */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary-500/15 blur-3xl"
            />
            <div className="relative flex flex-col gap-8 p-6 md:p-10 lg:flex-row lg:items-center lg:gap-16 lg:p-14">
                <div className="flex flex-col gap-2 lg:w-2/5">
                    <span className="flex items-center gap-2 text-base font-medium text-primary-300">
                        <Banknote className="size-5" strokeWidth={1.75} aria-hidden />
                        {ACCELERATOR_PROGRAM_NAME}
                    </span>
                    <p className="text-sm font-light text-mist-300">Loans of up to</p>
                    <p className="text-5xl font-semibold tracking-tight text-white md:text-6xl">{ACCELERATOR_LOAN_LABEL}</p>
                </div>
                <div className="flex flex-1 flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <h3 className="text-2xl tracking-tight text-white md:text-3xl">The funding to grow your workshop.</h3>
                        <p className="text-base font-light text-mist-300">
                            Skill gets you the job. Growing takes money. Makers on MANDE can borrow up to{" "}
                            {ACCELERATOR_LOAN_LABEL} through the {ACCELERATOR_PROGRAM_NAME} to invest in their business and
                            take on bigger work.
                        </p>
                        <p className="text-sm font-light text-mist-400">
                            Makers who rank high on MANDE can apply. Doing great work on your jobs is what moves you up.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href={ACCELERATOR_URL} className={WEBSITE_ON_DARK_BUTTON}>
                            How the accelerator works
                        </Link>
                        <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_ON_DARK_OUTLINE_BUTTON}>
                            Join MANDE
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
