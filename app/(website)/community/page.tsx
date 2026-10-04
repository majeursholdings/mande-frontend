import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import CommunityPage from "@/components/mainWebsite/communityPage";

export const metadata: Metadata = pageMetadata({
    title: "Community | MANDE",
    description:
        "Join the MANDE community of furniture makers: job alerts on WhatsApp, tips, finished pieces and meet-ups at our Lagos factory.",
    path: "/community",
});

export default function CommunityRoute() {
    return <CommunityPage />;
}
