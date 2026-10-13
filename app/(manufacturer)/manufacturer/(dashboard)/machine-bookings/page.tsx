import { Suspense } from "react";
import ManufacturerMachineBookingsPage from "@/components/manufacturerPlatform/machineBookingsPage";

export default function ManufacturerMachineBookingsRoute() {
    // The bookings table reads its page from the URL
    return (
        <Suspense>
            <ManufacturerMachineBookingsPage />
        </Suspense>
    );
}
