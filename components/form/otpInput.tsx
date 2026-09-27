"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type OtpInputProps = {
    length: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    name?: string;
    /** Focus the first box on mount — for a screen that's only the code. */
    autoFocus?: boolean;
};

const DIGITS_ONLY = /^\d+$/;

export default function OtpInput({
    length,
    value,
    onChange,
    disabled,
    error,
    name,
    autoFocus,
}: OtpInputProps) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const digits = Array.from({ length }, (_, i) => value[i] ?? "");

    const setDigit = (index: number, digit: string) => {
        const next = digits.slice();
        next[index] = digit;
        onChange(next.join("").slice(0, length));
    };

    const focusInput = (index: number) => {
        inputRefs.current[index]?.focus();
        inputRefs.current[index]?.select();
    };

    const handleChange = (index: number, raw: string) => {
        const incoming = raw.slice(-1);
        if (incoming && !DIGITS_ONLY.test(incoming)) return;

        setDigit(index, incoming);
        if (incoming && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === "Backspace") {
            if (digits[index]) {
                setDigit(index, "");
            } else if (index > 0) {
                setDigit(index - 1, "");
                focusInput(index - 1);
            }
            e.preventDefault();
        } else if (e.key === "ArrowLeft" && index > 0) {
            focusInput(index - 1);
            e.preventDefault();
        } else if (e.key === "ArrowRight" && index < length - 1) {
            focusInput(index + 1);
            e.preventDefault();
        }
    };

    const handlePaste = (
        index: number,
        e: React.ClipboardEvent<HTMLInputElement>,
    ) => {
        const pasted = e.clipboardData.getData("text").trim();
        if (!DIGITS_ONLY.test(pasted)) return;
        e.preventDefault();

        const incoming = pasted.slice(0, length - index).split("");
        const next = digits.slice();
        incoming.forEach((digit, i) => {
            next[index + i] = digit;
        });
        onChange(next.join("").slice(0, length));

        const lastFilled = Math.min(index + incoming.length, length - 1);
        focusInput(lastFilled);
    };

    return (
        <div className="flex items-center gap-2 sm:gap-2.5" role="group" aria-label="Verification code">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    name={name ? `${name}-${index}` : undefined}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    autoFocus={autoFocus && index === 0}
                    maxLength={1}
                    disabled={disabled}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(index, e)}
                    aria-label={`Digit ${index + 1} of ${length}`}
                    className={cn(
                        "h-12 w-10 sm:h-14 sm:w-12.5 rounded-lg border text-center text-lg font-semibold font-text text-[#1F2937] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-secondary-700/50 focus-visible:border-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed",
                        error
                            ? "border-[#EF4444]"
                            : "border-gray-200 placeholder:text-gray-300",
                    )}
                />
            ))}
        </div>
    );
}
