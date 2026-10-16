"use client";

import { Headset } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatPrice } from "@/lib/currency";
import { PLATFORMS } from "@/components/manufacturerPlatform/communityPage/platforms";
import {
    FIRST_PIECE_DELAY_S,
    LIGHT_CARD,
    NEXT_PIECE_DELAY_S,
    OverlayPiece,
    PhotoOverlay,
    SAMPLE_JOB,
} from "./photoOverlay";

const WHATSAPP = PLATFORMS.whatsapp;

/** Short form of SUPPORT_HOURS, to fit the chip. */
const SUPPORT_HOURS_SHORT = "Mon to Sat, 8am to 6pm";

/** The reactions pop onto the message once it has landed. */
const REACTIONS_DELAY_S = FIRST_PIECE_DELAY_S + NEXT_PIECE_DELAY_S + 0.45;

/**
 * The community card's photo (makers sharing something on a phone) dressed
 * with the app's world: the support team's "online" chip by the window, and
 * a job alert in the makers' WhatsApp group on the workbench, the same job
 * the jobs card shows.
 */
export default function CommunityPhotoOverlay() {
    const reduceMotion = useReducedMotion();

    return (
        <PhotoOverlay>
            <OverlayPiece
                from="right"
                className="top-4 right-4"
                cardClassName={`flex items-center gap-2 ${LIGHT_CARD}`}
            >
                <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-800">
                    <Headset className="size-3.5" strokeWidth={2} />
                    <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                        <span className="absolute inset-0 rounded-full bg-primary-400 opacity-75 motion-safe:animate-ping" />
                        <span className="relative size-2.5 rounded-full bg-primary-500 ring-2 ring-white" />
                    </span>
                </span>
                <div className="pr-1">
                    <p className="text-xs font-medium text-mist-950">Support online</p>
                    <p className="text-[10px] text-mist-500">{SUPPORT_HOURS_SHORT}</p>
                </div>
            </OverlayPiece>

            <OverlayPiece
                from="right"
                order={1}
                className="right-4 bottom-4 w-[min(56%,15rem)]"
                cardClassName={`flex flex-col gap-1.5 ${LIGHT_CARD}`}
            >
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-mist-950">
                    <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full text-white ${WHATSAPP.badgeClass}`}
                    >
                        <WHATSAPP.Icon className="size-2.5" />
                    </span>
                    MANDE community
                    <span className="ml-auto font-normal text-mist-400">9:41</span>
                </p>
                <p className="rounded-lg rounded-tl-none bg-primary-50 px-2 py-1.5 text-[11px] leading-snug text-mist-800">
                    <span className="font-medium text-primary-800">New job:</span> {SAMPLE_JOB.name},{" "}
                    {formatPrice(SAMPLE_JOB.budget)}
                </p>
                <motion.span
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 420, damping: 16, delay: REACTIONS_DELAY_S }}
                    className="absolute -bottom-2.5 left-3 rounded-full bg-white px-1.5 py-0.5 text-[10px] shadow-sm ring-1 ring-black/5"
                >
                    🔥 12 · 👍 8
                </motion.span>
            </OverlayPiece>
        </PhotoOverlay>
    );
}
