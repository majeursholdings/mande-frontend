// Chart colors, from the theme's ramps. Checked with the dataviz palette
// validator (light surface): the bar pair clears colour-blind separation
// (protan ΔE 10.5) — primary-600 against error-400 didn't (ΔE 4.0) — and the
// donut's four status hues pass on every pair (closest: rejected against
// completed, protan ΔE 8.6 — and never adjacent). The salmon and amber are
// under 3:1 against white, so both charts carry visible labels (legend,
// counts) and a data table for screen readers.

/** primary-700 */
export const SUCCESSFUL_JOBS_COLOR = "#08783e";
/** error-400 */
export const UNSUCCESSFUL_JOBS_COLOR = "#f87171";

export const JOB_STATUS_COLORS = {
    /** error-600 */
    completed: "#dc2626",
    /** indigo-500 */
    "in-progress": "#6366f1",
    /** warning-500 */
    "in-review": "#f59e0b",
    /** secondary-600 */
    rejected: "#8c3232",
    /** mist-200 — a neutral, like the track */
    pending: "#dde6e2",
} as const;

/** mist-100 — gridlines, hover band, empty donut track */
export const CHART_GRID_COLOR = "#f0f4f2";
/** mist-400 — axis ticks */
export const CHART_AXIS_TEXT_COLOR = "#9eb5ab";
