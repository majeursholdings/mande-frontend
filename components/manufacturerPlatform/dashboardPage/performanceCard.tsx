import DonutChart from "./donutChart";

export default function PerformanceCard({ percentage }: { percentage: number }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-white p-5 lg:w-72">
            <h3 className="self-start text-base font-semibold font-text text-mist-950">
                Performance
            </h3>
            <DonutChart percentage={percentage} />
            <p className="text-sm font-text text-mist-500 text-center">
                Total cummulative performance
            </p>
        </div>
    );
}
