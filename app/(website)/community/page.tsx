import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getWebsiteCommunity } from "@/lib/services/websiteService";
import CommunityPage from "@/components/mainWebsite/communityPage";

export const metadata: Metadata = pageMetadata({
    title: "Community | MANDE",
    description:
        "Join the MANDE community of furniture makers: job alerts on WhatsApp, tips, finished pieces and meet-ups at our Lagos factory.",
    path: "/community",
});

export const revalidate = 60;

export default async function CommunityRoute() {
    const data = await getWebsiteCommunity();
    return <CommunityPage data={data} />;
}
