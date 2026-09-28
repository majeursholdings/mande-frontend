import {
    BriefcaseBusiness,
    CircleHelp,
    Factory,
    House,
    Info,
    LifeBuoy,
    MessageSquareText,
    UsersRound,
    type LucideIcon,
} from "lucide-react";
import { ABOUT_URL, COMMUNITY_URL, CONTACT_URL, FAQ_URL, OPEN_JOBS_URL, SERVICES_URL } from "@/constant/navigation";

// The website menu's icons, by where each item goes (the menu data in
// constant/navigation.ts stays import-free — next.config.ts reads it). A
// group, like Help Center, is keyed by its label.
const ICONS: Record<string, LucideIcon> = {
    "/": House,
    [OPEN_JOBS_URL]: BriefcaseBusiness,
    [SERVICES_URL]: Factory,
    [COMMUNITY_URL]: UsersRound,
    [ABOUT_URL]: Info,
    [CONTACT_URL]: MessageSquareText,
    [FAQ_URL]: CircleHelp,
    "Help Center": LifeBuoy,
};

/** A menu item's icon — by its link, or for a group, its label. */
export function MenuIcon({ item, className }: { item: { label: string; href?: string }; className?: string }) {
    const Icon = ICONS[item.href ?? item.label] ?? Info;
    return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
