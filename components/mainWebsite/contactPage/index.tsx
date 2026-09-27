import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Headset, Mail, MessageCircleQuestion, UsersRound, type LucideIcon } from "lucide-react";
import { ARTISAN_LOGIN_URL, FAQ_URL } from "@/constant/navigation";
import { FEATURED_COMMUNITY_CHANNEL } from "@/constant/community";
import { CONTACT_DETAILS } from "@/constant/website";
import ContactForm from "../form/contactForm";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";

// ─────────────────────────────────────────────────────────────────────────────
// Contact MANDE — a message form beside the other ways to reach the team:
// email and hours, support for makers already on MANDE, the community and
// the FAQs.
// ─────────────────────────────────────────────────────────────────────────────

export default function ContactPage() {
    return (
        <>
            <PageHero
                eyebrow="Contact"
                title="Talk to the MANDE team."
                description="Joining as a maker, a furniture project for our makers, or a partnership — send us a message and we'll get back to you by email."
            />

            <SectionWrapper containerClassName="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
                <section aria-labelledby="contact-form-title" className="rounded-[10px] border border-border bg-white p-5 md:p-8">
                    <h2 id="contact-form-title" className="mb-1 text-2xl tracking-tight">
                        Send us a message
                    </h2>
                    <p className="mb-6 text-sm font-light text-mist-600">We usually reply within one working day.</p>
                    <ContactForm />
                </section>

                <aside aria-label="Other ways to reach us" className="flex flex-col gap-4">
                    <ContactCard icon={Mail} title="Email us">
                        <a href={`mailto:${CONTACT_DETAILS.email}`} className="font-medium text-primary-800 underline-offset-4 hover:underline">
                            {CONTACT_DETAILS.email}
                        </a>
                    </ContactCard>
                    <ContactCard icon={Clock} title="When we're around">
                        {CONTACT_DETAILS.hours}
                    </ContactCard>
                    <ContactCard icon={Headset} title="Already a MANDE maker?">
                        Log in and open <span className="font-medium">Profile › Talk to support</span> to chat with our team about
                        your jobs, payments or account.{" "}
                        <Link href={ARTISAN_LOGIN_URL} className="font-medium text-primary-800 underline-offset-4 hover:underline">
                            Log in
                        </Link>
                    </ContactCard>
                    <ContactCard icon={UsersRound} title="Join the community">
                        Meet other makers on our{" "}
                        <a
                            href={FEATURED_COMMUNITY_CHANNEL.href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary-800 underline-offset-4 hover:underline"
                        >
                            WhatsApp channel
                        </a>
                        .
                    </ContactCard>
                    <ContactCard icon={MessageCircleQuestion} title="Quick answers">
                        Payments, plans and how jobs work are covered in the{" "}
                        <Link href={FAQ_URL} className="font-medium text-primary-800 underline-offset-4 hover:underline">
                            FAQs
                        </Link>
                        .
                    </ContactCard>
                </aside>
            </SectionWrapper>
        </>
    );
}

function ContactCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
    return (
        <div className="flex gap-4 rounded-[10px] bg-mist-200 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary-900">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-base font-medium">{title}</h3>
                <p className="text-sm font-light wrap-anywhere text-mist-700">{children}</p>
            </div>
        </div>
    );
}
