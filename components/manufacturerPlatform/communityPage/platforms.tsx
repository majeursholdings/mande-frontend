import type { CommunityPlatform } from "@/constant/community";
import {
    FacebookGlyphIcon,
    InstagramIcon,
    LinkedInIcon,
    MandeBadgeIcon,
    TelegramIcon,
    TikTokIcon,
    WhatsAppIcon,
    XIcon,
    YouTubeIcon,
    type SocialIconProps,
} from "../socialIcons";

/** Each platform's name, mark and brand colour — what makes its card recognisable. */
export const PLATFORMS: Record<
    CommunityPlatform,
    {
        name: string;
        Icon: (props: SocialIconProps) => React.JSX.Element;
        /** Background for the platform's badge. */
        badgeClass: string;
        /** Text colour for links in the platform's colour. */
        accentClass: string;
    }
> = {
    whatsapp: {
        name: "WhatsApp",
        Icon: WhatsAppIcon,
        badgeClass: "bg-[#25D366]",
        accentClass: "text-[#128C7E]",
    },
    tiktok: {
        name: "TikTok",
        Icon: TikTokIcon,
        badgeClass: "bg-[#010101]",
        accentClass: "text-[#010101]",
    },
    instagram: {
        name: "Instagram",
        Icon: InstagramIcon,
        badgeClass: "bg-linear-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]",
        accentClass: "text-[#D62976]",
    },
    linkedin: {
        name: "LinkedIn",
        Icon: LinkedInIcon,
        badgeClass: "bg-[#0A66C2]",
        accentClass: "text-[#0A66C2]",
    },
    x: {
        name: "X",
        Icon: XIcon,
        badgeClass: "bg-[#0F1419]",
        accentClass: "text-[#0F1419]",
    },
    youtube: {
        name: "YouTube",
        Icon: YouTubeIcon,
        badgeClass: "bg-[#FF0000]",
        accentClass: "text-[#CC0000]",
    },
    facebook: {
        name: "Facebook",
        Icon: FacebookGlyphIcon,
        badgeClass: "bg-[#1877F2]",
        accentClass: "text-[#1877F2]",
    },
    telegram: {
        name: "Telegram",
        Icon: TelegramIcon,
        badgeClass: "bg-[#229ED9]",
        accentClass: "text-[#229ED9]",
    },
    mande: {
        name: "Mande Review",
        Icon: MandeBadgeIcon,
        badgeClass: "bg-[#075E54]",
        accentClass: "text-[#075E54]",
    },
};
