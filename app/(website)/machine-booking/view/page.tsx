import type { Metadata } from "next";
import MachineBookingViewPage from "@/components/mainWebsite/machineBookingViewPage";

// A private link from a booking email: never in search results
export const metadata: Metadata = {
    title: "Your machine booking | MANDE",
    robots: { index: false, follow: false },
};

export default async function MachineBookingViewRoute({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { token } = await searchParams;
    return <MachineBookingViewPage token={typeof token === "string" && token ? token : null} />;
}
