import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MachineView from "@/components/mainWebsite/machinesPage/machineView";
import { getMachineUrl } from "@/constant/navigation";
import { pageMetadata } from "@/lib/seo";
import { getWebsiteMachine } from "@/lib/services/websiteService";

type Props = { params: Promise<{ machineId: string }> };

/** A short description for search results and shared links: the start of the machine's own. */
const summarize = (text: string) => (text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { machineId } = await params;
    const detail = await getWebsiteMachine(machineId);
    if (!detail) return { title: "Machine not found | MANDE", robots: { index: false } };
    const { machine } = detail;
    const description =
        machine.description ||
        `${machine.name}${machine.model ? ` (${machine.model})` : ""}, a furniture machine at the MANDE factory in Lagos. Open to every maker: see its prices and book time.`;
    return pageMetadata({
        title: `${machine.name} | MANDE furniture machines`,
        description: summarize(description),
        path: getMachineUrl(machine.id),
    });
}

// A machine that's gone from the catalogue (deactivated, or no such machine) is a 404
export default async function MachineRoute({ params }: Props) {
    const { machineId } = await params;
    const detail = await getWebsiteMachine(machineId);
    if (!detail) notFound();
    return <MachineView detail={detail} />;
}
