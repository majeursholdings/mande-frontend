import type { Metadata } from "next";
import MachineBookingCompletePage from "@/components/mainWebsite/machineBookingCompletePage";

// Where the payment partner sends a machine booker back to: never in search results
export const metadata: Metadata = {
    title: "Your machine booking | MANDE",
    robots: { index: false, follow: false },
};

export default async function MachineBookingCompleteRoute({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { reference } = await searchParams;
    return <MachineBookingCompletePage reference={typeof reference === "string" ? reference : null} />;
}
