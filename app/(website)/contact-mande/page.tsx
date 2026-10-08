import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getWebsiteCommunity } from "@/lib/services/websiteService";
import ContactPage from "@/components/mainWebsite/contactPage";

export const metadata: Metadata = pageMetadata({
    title: "Contact MANDE",
    description:
        "Get in touch with the MANDE team about joining as a furniture maker, a project for our makers, or a partnership.",
    path: "/contact-mande",
});

export const revalidate = 60;

export default async function ContactMandeRoute() {
    const community = await getWebsiteCommunity();
    const whatsappUrl = community?.allChannels.find((channel) => channel.platform === "whatsapp")?.url || null;
    return <ContactPage whatsappUrl={whatsappUrl} />;
}
