"use client";

import { Star, Award, MessageSquare, TrendingUp } from "lucide-react";

interface ReviewsOverviewProps {
    overview?: {
        averageRating: number;
        totalReviews: number;
        fiveStarCount: number;
        positiveRate: number;
    };
    isPending?: boolean;
}

export default function ReviewsOverviewCards({ overview, isPending }: ReviewsOverviewProps) {
    if (isPending) {
        return (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 animate-pulse">
                        <div className="size-9 rounded-full bg-mist-100" />
                        <div className="h-3.5 w-20 rounded bg-mist-100" />
                        <div className="h-6 w-12 rounded bg-mist-200" />
                    </div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            id: "avg-rating",
            label: "Average Rating",
            value: `${overview?.averageRating ?? 5.0} / 5.0`,
            icon: Star,
            iconColor: "bg-warning-50 text-warning-600",
            fill: true,
        },
        {
            id: "total-reviews",
            label: "Total Reviews",
            value: overview?.totalReviews ?? 0,
            icon: MessageSquare,
            iconColor: "bg-secondary-50 text-secondary-600",
            fill: false,
        },
        {
            id: "five-star",
            label: "5-Star Reviews",
            value: overview?.fiveStarCount ?? 0,
            icon: Award,
            iconColor: "bg-primary-50 text-primary-600",
            fill: false,
        },
        {
            id: "positive-rate",
            label: "Positive Rate",
            value: `${overview?.positiveRate ?? 100}%`,
            icon: TrendingUp,
            iconColor: "bg-indigo-50 text-indigo-600",
            fill: false,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-xs"
                    >
                        <span className={`flex size-9 items-center justify-center rounded-full ${card.iconColor}`}>
                            <Icon
                                className="size-4.5"
                                strokeWidth={1.75}
                                fill={card.fill ? "currentColor" : "none"}
                            />
                        </span>
                        <div>
                            <p className="text-xs font-text text-mist-500">{card.label}</p>
                            <p className="text-xl font-semibold font-text text-mist-950">{card.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
