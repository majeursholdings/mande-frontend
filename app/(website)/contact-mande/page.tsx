import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ContactPage from "@/components/mainWebsite/contactPage";

export const metadata: Metadata = pageMetadata({
    title: "Contact MANDE",
    description:
        "Get in touch with the MANDE team about joining as a furniture maker, a project for our makers, or a partnership.",
    path: "/contact-mande",
});

export default function ContactMandeRoute() {
    return <ContactPage />;
}
