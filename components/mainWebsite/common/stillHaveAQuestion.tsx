import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { CONTACT_URL } from "@/constant/navigation";
import { CONTACT_DETAILS } from "@/constant/website";
import { WEBSITE_PRIMARY_BUTTON } from "./buttonStyles";

/** Under the FAQs and help articles: a way to ask anything else. */
export default function StillHaveAQuestion() {
    return (
        <div className="flex flex-col items-start gap-4 rounded-[10px] bg-mist-200 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex gap-4">
                <MessageCircleQuestion className="mt-0.5 size-6 shrink-0 text-primary-800" strokeWidth={1.5} aria-hidden />
                <div className="flex flex-col gap-1">
                    <p className="text-lg font-medium">Still have a question?</p>
                    <p className="text-sm font-light text-mist-700">Our team is here {CONTACT_DETAILS.hours}.</p>
                </div>
            </div>
            <Link href={CONTACT_URL} className={WEBSITE_PRIMARY_BUTTON}>
                Contact us
            </Link>
        </div>
    );
}
