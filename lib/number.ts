const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

/**
 * Shortens a number with a k / M / B / T suffix and at most one decimal,
 * dropped when it's .0 — 96000 → "96k", 500000 → "500k", 1800000 → "1.8M",
 * 2000000 → "2M", 2500000000 → "2.5B". Rounds into the next unit where it
 * should (999950 → "1M"), and leaves numbers under 1,000 as they are.
 */
export function formatCompactNumber(value: number): string {
    // Intl writes thousands as "K"; lowercase it to read "500k"
    return compactFormatter.format(value).replace(/K$/, "k");
}
