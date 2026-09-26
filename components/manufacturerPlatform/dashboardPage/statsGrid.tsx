import { DASHBOARD_STATS } from "@/constant/manufacturer";
import StatCard from "./statCard";

export default function StatsGrid() {
    return (
        <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible">
            {DASHBOARD_STATS.map((stat) => (
                <StatCard key={stat.id} stat={stat} />
            ))}
        </div>
    );
}
