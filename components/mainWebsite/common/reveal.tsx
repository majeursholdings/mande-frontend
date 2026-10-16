"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";

// ─────────────────────────────────────────────────────────────────────────────
// Fades and rises its content into place the first time it scrolls into view.
// In a grid, pass each item's index so a row comes in one card after another.
// With reduced motion, it only fades.
//
// Keep it outside a HoverCard (not on the same element), so the reveal and
// the hover lift don't fight over the card's position.
// ─────────────────────────────────────────────────────────────────────────────

const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];
/** Cards in a row come in this far apart; the next row starts over. */
const STAGGER_S = 0.1;
const ROW_LENGTH = 3;

const MOTION_TAGS = { div: motion.div, li: motion.li } as const;

export default function Reveal({
    as = "div",
    index = 0,
    className,
    children,
}: {
    /** The element to render: a list item in lists, otherwise a div. */
    as?: keyof typeof MOTION_TAGS;
    /** The item's place in its grid, for the stagger. */
    index?: number;
    className?: string;
    children: ReactNode;
}) {
    const reduceMotion = useReducedMotion();
    // The tags share their props; one cast keeps the union happy
    const Component = MOTION_TAGS[as] as typeof motion.div;

    return (
        <Component
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration: 0.6,
                ease: EASE_OUT,
                delay: (index % ROW_LENGTH) * STAGGER_S,
            }}
            className={className}
        >
            {children}
        </Component>
    );
}
