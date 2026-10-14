import type { Metadata } from "next";
import MachineBookingLookupPage from "@/components/mainWebsite/machineBookingLookupPage";

// A personal lookup: never in search results
export const metadata: Metadata = {
    title: "My machine bookings | MANDE",
    robots: { index: false, follow: false },
};

export default function MachineBookingLookupRoute() {
    return <MachineBookingLookupPage />;
}
