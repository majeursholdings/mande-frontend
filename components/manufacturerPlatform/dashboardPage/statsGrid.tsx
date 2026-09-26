import { DASHBOARD_STATS } from "@/constant/manufacturer";
import StatCard from "./statCard";

export default function StatsGrid() {
    return (
        // 2 × 2 on phones; four equal columns that fill the row from desktop up
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {DASHBOARD_STATS.map((stat) => (
                <StatCard key={stat.id} stat={stat} />
            ))}
        </div>
    );
}
