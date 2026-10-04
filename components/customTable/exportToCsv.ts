// ─────────────────────────────────────────────────────────────────────────────
// exportToCSV  — generic, works with any array of objects
//
// Usage:
//   exportToCSV(rows)
//   exportToCSV(rows, { filename: "subscribers-export" })
//   exportToCSV(rows, { columns: ["organization", "plan", "status"] })
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportCSVOptions {
    /** File name without extension. Defaults to "export-<timestamp>" */
    filename?: string;
    /**
     * Subset of keys to include, in order. Defaults to all keys
     * from the first row.
     */
    columns?: string[];
}

export function exportToCSV<TRow extends object>(
    rows: TRow[],
    options: ExportCSVOptions = {},
): void {
    if (rows.length === 0) return;

    const keys = (options.columns ?? Object.keys(rows[0])) as (keyof TRow)[];
    const filename = options.filename ?? `export-${Date.now()}`;

    // Header row — turn camelCase / snake_case into "Title Case"
    const toTitle = (key: string) =>
        key
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/^\w/, (c) => c.toUpperCase())
            .trim();

    const escape = (val: unknown) => {
        let str = val == null ? "" : String(val);
        // A cell starting with = + - @ (or a tab / carriage return) runs as a
        // formula in Excel and Sheets, and names and descriptions come from
        // users: a leading ' makes it plain text. Numbers are left alone.
        if (typeof val !== "number" && /^[=+\-@\t\r]/.test(str)) str = `'${str}`;
        // Wrap in quotes if the value contains a comma, quote, or newline
        return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const header = keys.map((k) => toTitle(String(k))).join(",");
    const body = rows
        .map((row) => keys.map((k) => escape(row[k])).join(","))
        .join("\n");

    const blob = new Blob([`${header}\n${body}`], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
