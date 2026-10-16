"use client";

import { BriefcaseBusiness, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatPrice } from "@/lib/currency";
import { JOB_BONUS_PERCENT, JOB_PAYMENT_SCHEDULE } from "@/constant/jobWorkflow";
import { DARK_CARD, FIRST_PIECE_DELAY_S, LIGHT_CARD, OverlayPiece, PhotoOverlay, SAMPLE_JOB } from "./photoOverlay";

/** Paid so far: up to the frame, the same payment the wallet card shows landing. */
const PAID_STAGES = 2;
const LAST_PAID = JOB_PAYMENT_SCHEDULE[PAID_STAGES - 1];

/** The paid stages fill one after another, once the payments card has landed. */
const FILL_DELAY_S = FIRST_PIECE_DELAY_S + 0.3;
const FILL_STAGGER_S = 0.18;

/**
 * The jobs card's photo (a maker going over a job's drawings) dressed with
 * the app's own UI: the job's stage payments filling in, then the job itself
 * with its budget and deadline.
 */
export default function JobsPhotoOverlay() {
    const reduceMotion = useReducedMotion();

    return (
        <PhotoOverlay>
            <OverlayPiece
                from="right"
                className="top-4 right-4 w-[min(52%,14rem)]"
                cardClassName={`flex flex-col gap-2 ${LIGHT_CARD}`}
            >
                <p className="flex items-baseline justify-between gap-2 text-xs font-medium text-mist-950">
                    Job payments
                    <span className="shrink-0 text-[10px] font-normal text-mist-500">
                        {PAID_STAGES} of {JOB_PAYMENT_SCHEDULE.length} paid
                    </span>
                </p>
                <div className="flex gap-1">
                    {JOB_PAYMENT_SCHEDULE.map((payment, index) => (
                        <span key={payment.milestone} className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist-200">
                            {index < PAID_STAGES && (
                                <motion.span
                                    initial={reduceMotion ? { opacity: 0 } : { scaleX: 0 }}
                                    whileInView={{ scaleX: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.4,
                                        ease: "easeOut",
                                        delay: FILL_DELAY_S + index * FILL_STAGGER_S,
                                    }}
                                    className="block size-full origin-left rounded-full bg-primary-500"
                                />
                            )}
                        </span>
                    ))}
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className="flex items-center gap-1 text-[10px] text-mist-700">
                        <Check className="size-3 text-primary-600" strokeWidth={2.5} />
                        {LAST_PAID.label}
                    </p>
                    <p className="text-[10px] font-medium text-primary-700">
                        +{JOB_BONUS_PERCENT}% bonus for finishing on time
                    </p>
                </div>
            </OverlayPiece>

            <OverlayPiece
                from="bottom"
                order={1}
                className="bottom-4 left-4"
                cardClassName={`flex flex-col gap-1 ${DARK_CARD}`}
            >
                <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-primary-100 uppercase">
                    <BriefcaseBusiness className="size-3" strokeWidth={2} />
                    Your job
                </p>
                <p className="text-base leading-tight font-semibold">{SAMPLE_JOB.name}</p>
                <p className="text-[10px] text-primary-200">
                    Budget {formatPrice(SAMPLE_JOB.budget)} · {SAMPLE_JOB.daysLeft} days left
                </p>
            </OverlayPiece>
        </PhotoOverlay>
    );
}
