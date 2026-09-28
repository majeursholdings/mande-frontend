import type { Metadata } from "next";
import CommunityPage from "@/components/mainWebsite/communityPage";

export const metadata: Metadata = {
    title: "Community | MANDE",
    description: "Join the MANDE community of furniture makers: job alerts on WhatsApp, tips, finished pieces and meet-ups at our Lagos factory.",
};

export default function CommunityRoute() {
    return <CommunityPage />;
}
