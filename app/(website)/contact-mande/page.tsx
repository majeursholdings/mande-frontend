import type { Metadata } from "next";
import ContactPage from "@/components/mainWebsite/contactPage";

export const metadata: Metadata = {
    title: "Contact MANDE",
    description: "Get in touch with the MANDE team — about joining as a furniture maker, a project for our makers, or a partnership.",
};

export default function ContactMandeRoute() {
    return <ContactPage />;
}
