"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Transition, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The website's card hover, shared by every card so they all move alike: the
// card lifts a little on a soft shadow and a green line draws across its top
// edge. A HoverCardIcon inside it gives its icon a small wiggle at the same
// time. With reduced motion, only the line shows.
//
// Give HoverCard the card's own rounding (e.g. rounded-[10px]) so the shadow
// and the line follow its corners. A card that is itself a link can sit
// inside one: <HoverCard className="h-full rounded-[10px]"><Link …/></HoverCard>.
// ─────────────────────────────────────────────────────────────────────────────

const SPRING: Transition = { type: "spring", stiffness: 320, damping: 24, mass: 0.8 };

const LIFT: Variants = {
    rest: { y: 0, boxShadow: "0 0 0 0 rgb(3 27 17 / 0)" },
    hover: { y: -6, boxShadow: "0 24px 44px -26px rgb(3 27 17 / 0.45)" },
};

const STILL: Variants = { rest: {}, hover: {} };

const LINE: Variants = {
    rest: { scaleX: 0, opacity: 0 },
    hover: { scaleX: 1, opacity: 1 },
};

const WIGGLE: Variants = {
    rest: { rotate: 0, scale: 1 },
    hover: { rotate: [0, -12, 9, -4, 0], scale: 1.12, transition: { duration: 0.55, ease: "easeInOut" } },
};

/** Whether the card draws its own border (a plain "border" class), so the line's clip sits over it. */
const hasBorder = (className?: string) => /(^|\s)border(\s|$)/.test(className ?? "");

const MOTION_TAGS = { div: motion.div, li: motion.li, article: motion.article } as const;

type HoverCardProps = {
    /** The element to render: a list item in lists, otherwise a div. */
    as?: keyof typeof MOTION_TAGS;
    /** Draw the green line across the top on hover. */
    line?: boolean;
    /** The line's colour, e.g. a lighter green on a dark card. */
    lineClassName?: string;
    className?: string;
    children: ReactNode;
} & Omit<HTMLMotionProps<"div">, "children" | "className">;

export default function HoverCard({
    as = "div",
    line = true,
    lineClassName,
    className,
    children,
    ...props
}: HoverCardProps) {
    const reduceMotion = useReducedMotion();
    // The tags share their props; one cast keeps the union happy
    const Component = MOTION_TAGS[as] as typeof motion.div;

    return (
        <Component
            initial="rest"
            animate="rest"
            whileHover="hover"
            variants={reduceMotion ? STILL : LIFT}
            transition={SPRING}
            className={cn("relative", className)}
            {...props}
        >
            {children}
            {line && (
                // The line is clipped by a layer shaped like the card (same corners,
                // and over the border when the card has one), so it bends round the
                // top corners instead of sticking out past them
                <span
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute z-10 overflow-hidden rounded-[inherit]",
                        hasBorder(className) ? "-inset-px" : "inset-0",
                    )}
                >
                    <motion.span
                        variants={LINE}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={cn("absolute inset-x-0 top-0 h-0.75 origin-left bg-primary-500", lineClassName)}
                    />
                </span>
            )}
        </Component>
    );
}

/** A card's icon (or its round badge) that wiggles when its HoverCard is hovered. */
export function HoverCardIcon({ className, children }: { className?: string; children: ReactNode }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.span variants={reduceMotion ? STILL : WIGGLE} className={className}>
            {children}
        </motion.span>
    );
}
