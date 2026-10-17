import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { MACHINES_URL } from "@/constant/navigation";
import MachinesPage from "@/components/mainWebsite/machinesPage";

export const metadata: Metadata = pageMetadata({
    title: "Furniture machines in Lagos | MANDE",
    description:
        "The top furniture machines at the MANDE factory in Lagos, open to every maker. See what each one does and its price, then book time. Members save on every booking.",
    path: MACHINES_URL,
});

type Props = { searchParams: Promise<{ category?: string | string[] }> };

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default async function MachinesRoute({ searchParams }: Props) {
    const category = first((await searchParams).category)?.trim() || undefined;
    return <MachinesPage category={category} />;
}
