"use client";

import { useEffect, useState } from "react";

/** Ticks a countdown down to zero once per second. Call `restart()` to run it again. */
export function useCountdown(seconds: number) {
    const [secondsLeft, setSecondsLeft] = useState(seconds);
    const [generation, setGeneration] = useState(0);

    useEffect(() => {
        if (seconds <= 0) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => clearInterval(interval);
        // `generation` re-arms the interval on restart(); it doesn't drive the effect body itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generation]);

    const restart = () => {
        setSecondsLeft(seconds);
        setGeneration((g) => g + 1);
    };

    return { secondsLeft, restart };
}
