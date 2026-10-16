"use client";

import { ArrowDown, WalletMinimal } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { formatPrice } from "@/lib/currency";
import { JOB_PAYMENT_SCHEDULE } from "@/constant/jobWorkflow";
import {
    DARK_CARD,
    FIRST_PIECE_DELAY_S,
    LIGHT_CARD,
    NEXT_PIECE_DELAY_S,
    OverlayPiece,
    PhotoOverlay,
    SAMPLE_JOB,
} from "./photoOverlay";

/** A stage payment as the wallet would show it: the frame-approved part of the sample job. */
const SAMPLE_PAYMENT = JOB_PAYMENT_SCHEDULE[1];
const SAMPLE_AMOUNT = (SAMPLE_JOB.budget * SAMPLE_PAYMENT.percent) / 100;
const SAMPLE_BALANCE = 482_500;

/** The arrow pops into its circle once the notification has landed. */
const ARROW_DELAY_S = FIRST_PIECE_DELAY_S + NEXT_PIECE_DELAY_S;

// On card hover (the "hover" variant from the HoverCard around it), the arrow
// drops out the bottom of its circle and back in from the top, like money
// landing, while a ring pulses out from the circle
const ARROW_DROP: Variants = {
    rest: { y: 0, opacity: 1 },
    hover: {
        y: [0, 14, -14, 0],
        opacity: [1, 0, 0, 1],
        transition: { duration: 0.6, times: [0, 0.4, 0.41, 1], ease: "easeInOut" },
    },
};

const RING_PULSE: Variants = {
    rest: { scale: 1, opacity: 0 },
    hover: { scale: [1, 1.9], opacity: [0.5, 0], transition: { duration: 0.8, ease: "easeOut" } },
};

const STILL: Variants = { rest: {}, hover: {} };

/**
 * The wallet card's photo dressed with the app's own UI: a "Payment received"
 * notification floating above the maker's phone, then their wallet balance
 * in the corner.
 */
export default function WalletPhotoOverlay() {
    return (
        <PhotoOverlay>
            <OverlayPiece
                from="right"
                className="top-4 right-4 w-[min(58%,15rem)]"
                cardClassName={`flex items-center gap-2.5 ${LIGHT_CARD}`}
            >
                <PaymentArrow />
                <div className="min-w-0 flex-1">
                    <p className="flex items-baseline justify-between gap-2 text-xs font-medium text-mist-950">
                        Payment received
                        <span className="shrink-0 text-[10px] font-normal text-mist-400">now</span>
                    </p>
                    <p className="text-sm font-semibold text-primary-700">+{formatPrice(SAMPLE_AMOUNT)}</p>
                    <p className="truncate text-[10px] text-mist-500">{SAMPLE_PAYMENT.label}</p>
                </div>
            </OverlayPiece>

            <OverlayPiece
                from="bottom"
                order={1}
                className="bottom-4 left-4"
                cardClassName={`flex flex-col gap-1 ${DARK_CARD}`}
            >
                <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-primary-100 uppercase">
                    <WalletMinimal className="size-3" strokeWidth={2} />
                    MANDE wallet
                </p>
                <p className="text-lg leading-tight font-semibold">{formatPrice(SAMPLE_BALANCE)}</p>
                <p className="text-[10px] text-primary-200">Available to withdraw</p>
            </OverlayPiece>
        </PhotoOverlay>
    );
}

/** The notification's green "money in" circle, with its arrow animated in and on hover. */
function PaymentArrow() {
    const reduceMotion = useReducedMotion();

    return (
        <span className="relative flex size-8 shrink-0">
            <motion.span
                variants={reduceMotion ? STILL : RING_PULSE}
                className="absolute inset-0 rounded-full bg-primary-500"
            />
            <motion.span
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 420, damping: 16, delay: ARROW_DELAY_S }}
                className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-primary-500 text-white"
            >
                <motion.span
                    initial={reduceMotion ? false : { y: -14 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 14, delay: ARROW_DELAY_S + 0.1 }}
                    className="flex"
                >
                    <motion.span variants={reduceMotion ? STILL : ARROW_DROP} className="flex">
                        <ArrowDown className="size-4" strokeWidth={2.5} />
                    </motion.span>
                </motion.span>
            </motion.span>
        </span>
    );
}
