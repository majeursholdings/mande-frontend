import { DEFAULT_CURRENCY, DEFAULT_IMAGE } from "@/constant/global";
import { Banknote, BriefcaseBusiness, CalendarClock, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type JobCardProps = {
    referenceId: string;
    imageSrc?: string;
    title: string;
    cost: number;
    category: string;
    timeline: string;
};

export default function JobCard({
    imageSrc,
    title,
    cost,
    category,
    timeline,
    referenceId,
}: JobCardProps) {
    return (
        <div className="border rounded-[10px] overflow-hidden group">
            <div className="aspect-3/2 overflow-clip">
                <Image
                    src={imageSrc || DEFAULT_IMAGE}
                    alt={`${title} - ${cost}`}
                    title={`${title} - ${cost}`}
                    width={300}
                    height={200}
                    className="w-full aspect-3/2 object-center object-cover group-hover:scale-110 transition-all duration-300"
                />
            </div>
            <div className="p-2.5 md:p-5 space-y-3 group-hover:bg-mist-100 transition-all duration-300">
                <h4 className="text-lg font-medium">{title}</h4>
                <div className="flex gap-3 items-center justify-start flex-wrap">
                    <div className="flex-1 flex gap-1 items-center">
                        <BriefcaseBusiness className="text-mist-400 size-4" />
                        <span className="text-mist-500 text-xs">
                            {category}
                        </span>
                    </div>
                    <div className="flex-1 flex gap-1 items-center">
                        <Banknote className="text-mist-400 size-4" />
                        <span className="text-mist-500 text-xs">
                            {DEFAULT_CURRENCY}
                            {cost}
                        </span>
                    </div>
                    <div className="flex-1 flex gap-1 items-center">
                        <CalendarClock className="text-mist-400 size-4" />
                        <span className="text-mist-500 text-xs">
                            {timeline}
                        </span>
                    </div>
                </div>
                <div>
                    <Link href={`/open-jobs/${referenceId}`} className="flex items-center justify-start gap-1 text-xs text-secondary-500 hover:text-secondary-900 duration-300 transition-colors">
                        Apply now
                        <ExternalLink className="size-3"/>
                    </Link>
                </div>
            </div>
        </div>
    );
}