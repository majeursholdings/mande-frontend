"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The pieces of app UI laid over the service cards' photos (the wallet, jobs
// and community cards). Each piece floats in after its card has scrolled into
// view and lifts a little when the card is hovered. All of it is decoration:
// hidden from screen readers, with the photo's alt text saying what it shows.
// With reduced motion, the pieces only fade in.
// ─────────────────────────────────────────────────────────────────────────────

/** One job the overlays all tell the story of, so the cards agree with each other. */
export const SAMPLE_JOB = { name: "Oak sideboard", budget: 900_000, daysLeft: 21 };

export const ARRIVE: Transition = { type: "spring", stiffness: 260, damping: 22 };

/** The overlay's cards come in a moment after the card itself, then this far apart. */
export const FIRST_PIECE_DELAY_S = 0.5;
export const NEXT_PIECE_DELAY_S = 0.25;

const IN_VIEW = { once: true, amount: 0.6 } as const;

const FROM = {
    left: { x: -24, scale: 0.92 },
    right: { x: 24, scale: 0.92 },
    bottom: { y: 16 },
} as const;

/** The layer over the photo, with a soft shade at the bottom so the lower cards read against it. */
export function PhotoOverlay({ children }: { children: ReactNode }) {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 font-text">
            <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
            {children}
        </div>
    );
}

/**
 * One piece of UI over the photo. `className` places it (e.g. "top-4 right-4
 * w-[min(52%,14rem)]"); `cardClassName` styles the card itself.
 */
export function OverlayPiece({
    from,
    order = 0,
    className,
    cardClassName,
    children,
}: {
    /** The side it slides in from. */
    from: keyof typeof FROM;
    /** Its place in the overlay's sequence, for the delay. */
    order?: number;
    className?: string;
    cardClassName?: string;
    children: ReactNode;
}) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, ...FROM[from] }}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            viewport={IN_VIEW}
            transition={{ ...ARRIVE, delay: FIRST_PIECE_DELAY_S + order * NEXT_PIECE_DELAY_S }}
            className={cn("absolute", className)}
        >
            {/* The hover lift is CSS on an inner element, so it doesn't fight the arrival's transform */}
            <div
                className={cn(
                    "rounded-xl shadow-lg backdrop-blur-sm transition-transform duration-500 group-hover:-translate-y-1",
                    cardClassName,
                )}
            >
                {children}
            </div>
        </motion.div>
    );
}

/** The white notification-style card; the dark green one is for wallet-like panels. */
export const LIGHT_CARD = "bg-white/95 p-2.5 ring-1 ring-black/5";
export const DARK_CARD = "bg-primary-900/90 px-3.5 py-2.5 text-white ring-1 ring-white/10";
