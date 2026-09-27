"use client";

import { JOBS, getDashboardStats } from "@/constant/manufacturer";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import StatCard from "./statCard";

export default function StatsGrid() {
    const { wallet } = useManufacturerWallet();
    // Everything paid into the wallet for jobs — so a payment released now shows here at once
    const totalPaid = wallet.transactions.reduce(
        (sum, transaction) => sum + (transaction.type === "payment" ? transaction.amount : 0),
        0,
    );

    return (
        // 2 × 2 on phones; four equal columns that fill the row from desktop up
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {getDashboardStats(JOBS, totalPaid).map((stat) => (
                <StatCard key={stat.id} stat={stat} />
            ))}
        </div>
    );
}
