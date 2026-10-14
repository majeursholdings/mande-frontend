import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Factory, Headset, Mail, MessageCircleQuestion, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ARTISAN_LOGIN_URL, COMMUNITY_URL, FAQ_URL, MACHINE_BOOKING_MY_BOOKINGS_URL, MACHINES_URL } from "@/constant/navigation";
import { CONTACT_DETAILS } from "@/constant/website";
import ContactForm from "../form/contactForm";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import BookMachineTimeButton from "../servicesPage/bookMachineTimeButton";

// ─────────────────────────────────────────────────────────────────────────────
// Contact MANDE: a message form beside the other ways to reach the team:
// email and hours, booking machine time at the factory, support for makers
// already on MANDE, the community and the FAQs.
// ─────────────────────────────────────────────────────────────────────────────

/** whatsappUrl is the channel link saved in Settings › Community; without one, the community page. */
export default function ContactPage({ whatsappUrl }: { whatsappUrl: string | null }) {
    return (
        <>
            <PageHero
                eyebrow="Contact"
                title="Talk to the MANDE team."
                description="Joining as a maker, a furniture project for our makers, or a partnership: send us a message and we'll get back to you by email."
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
                    <ContactCard
                        icon={Factory}
                        title="Book machine time"
                        actions={
                            <>
                                <BookMachineTimeButton className={cn(WEBSITE_PRIMARY_BUTTON, "cursor-pointer text-sm")} />
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    <Link href={MACHINES_URL} className={CARD_LINK}>
                                        See our machines
                                    </Link>
                                    <Link href={MACHINE_BOOKING_MY_BOOKINGS_URL} className={CARD_LINK}>
                                        See your bookings
                                    </Link>
                                </div>
                            </>
                        }
                    >
                        The machines at our Lagos factory are open to every maker, and members save on every booking.
                    </ContactCard>
                    <ContactCard icon={Headset} title="Already a MANDE maker?">
                        Log in and open <span className="font-medium">Profile › Talk to support</span> to send our team a message about
                        your jobs, payments or account.{" "}
                        <Link href={ARTISAN_LOGIN_URL} className="font-medium text-primary-800 underline-offset-4 hover:underline">
                            Log in
                        </Link>
                    </ContactCard>
                    <ContactCard icon={UsersRound} title="Join the community">
                        Meet other makers on{" "}
                        {whatsappUrl ? (
                            <>
                                our{" "}
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={CARD_LINK}>
                                    WhatsApp channel
                                    <span className="sr-only"> (opens in a new tab)</span>
                                </a>
                                , or see all our channels on the{" "}
                                <Link href={COMMUNITY_URL} className={CARD_LINK}>
                                    community page
                                </Link>
                            </>
                        ) : (
                            <>
                                the{" "}
                                <Link href={COMMUNITY_URL} className={CARD_LINK}>
                                    community page
                                </Link>
                            </>
                        )}
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

const CARD_LINK = "font-medium text-primary-800 underline-offset-4 hover:underline";

/** One way to reach us: an icon, a title, a line of copy and, below it, any buttons or links (`actions`). */
function ContactCard({
    icon: Icon,
    title,
    children,
    actions,
}: {
    icon: LucideIcon;
    title: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="flex gap-4 rounded-[10px] bg-mist-200 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary-900">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-base font-medium">{title}</h3>
                <p className="text-sm font-light wrap-anywhere text-mist-700">{children}</p>
                {actions && <div className="mt-2 flex flex-col items-start gap-3">{actions}</div>}
            </div>
        </div>
    );
}
