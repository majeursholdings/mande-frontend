// ─────────────────────────────────────────────────────────────────────────────
// exportRows: saves a table's rows as a file, in the format the person picks
// from the Export menu (ExportMenu):
//   • csv:  plain text, with a byte order mark so Excel reads ₦ and accents
//   • xlsx: Excel; ods: OpenDocument (LibreOffice, Numbers, Google Sheets)
//   • pdf:  a printable table, landscape, with the title and date on top
// Each column says what its cells hold (`kind`), so numbers and money stay
// numbers in a spreadsheet, and dates are dates. The spreadsheet and PDF
// libraries are loaded only when someone exports, so they cost nothing on
// page load.
//
// Text from users (names, titles, addresses) can start with = + - @, which a
// spreadsheet would run as a formula from a CSV. CSV cells like that get a
// leading ', which shows them as text; in Excel and OpenDocument files every
// text cell is stored as text, so nothing is run.
// ─────────────────────────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "xlsx" | "ods" | "pdf";

export const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
    { value: "csv", label: "CSV (.csv)" },
    { value: "xlsx", label: "Excel (.xlsx)" },
    { value: "ods", label: "OpenDocument (.ods)" },
    { value: "pdf", label: "PDF (.pdf)" },
];

export type ExportCell = string | number | Date | null | undefined;

export interface ExportColumn<TRow> {
    header: string;
    value: (row: TRow) => ExportCell;
    /** What the cells hold. "money" is naira (convert from kobo first), shown with 2 decimal places. Defaults to text. */
    kind?: "text" | "number" | "money" | "date";
    /** Leave this column out of the PDF (which has room for fewer). */
    skipInPdf?: boolean;
}

export interface ExportOptions {
    format: ExportFormat;
    /** The file's name, without the extension, e.g. "products-2026-10-18". */
    filename: string;
    /** The heading on a PDF, and the sheet's name in a spreadsheet. */
    title: string;
}

const FORMULA_START = /^[=+\-@\t\r]/;

function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    // After the click has started the download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: ExportCell, kind: ExportColumn<unknown>["kind"]): string {
    if (value === null || value === undefined) return "";
    let text = value instanceof Date ? value.toISOString() : typeof value === "number" && kind === "money" ? value.toFixed(2) : String(value);
    if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The rows as CSV text (also used for an import template: a header with no rows). */
export function toCsv<TRow>(rows: TRow[], columns: ExportColumn<TRow>[]): string {
    const lines = [columns.map((column) => csvCell(column.header, "text")).join(",")];
    for (const row of rows) lines.push(columns.map((column) => csvCell(column.value(row), column.kind)).join(","));
    return `${lines.join("\r\n")}\r\n`;
}

/** Saves CSV text as a file; the byte order mark makes Excel read it as UTF-8. */
export function downloadCsv(csv: string, filename: string) {
    download(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

async function exportSpreadsheet<TRow>(rows: TRow[], columns: ExportColumn<TRow>[], options: ExportOptions & { format: "xlsx" | "ods" }) {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
        columns.map((column) => column.header),
        ...rows.map((row) => columns.map((column) => column.value(row) ?? null)),
    ], { cellDates: true });
    // Money with two decimal places, dates day first (OpenDocument only takes / between
    // a date's parts); widths from the longest value
    columns.forEach((column, columnIndex) => {
        const format = column.kind === "money" ? "#,##0.00" : column.kind === "date" ? "dd/mm/yyyy" : null;
        if (!format) return;
        rows.forEach((_row, rowIndex) => {
            const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex })];
            if (cell && (cell.t === "n" || cell.t === "d")) cell.z = format;
        });
    });
    sheet["!cols"] = columns.map((column) => ({
        wch: Math.min(60, Math.max(column.header.length, ...rows.slice(0, 200).map((row) => String(column.value(row) ?? "").length)) + 2),
    }));
    const book = XLSX.utils.book_new();
    // Sheet names can't hold some characters, and stop at 31
    XLSX.utils.book_append_sheet(book, sheet, options.title.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet1");
    XLSX.writeFile(book, `${options.filename}.${options.format}`, { bookType: options.format, compression: true });
}

async function exportPdf<TRow>(rows: TRow[], columns: ExportColumn<TRow>[], options: ExportOptions) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const shown = columns.filter((column) => !column.skipInPdf);
    // The PDF's built-in fonts have no ₦, so money reads "NGN"
    const naira = (text: string) => text.replace(/₦/g, "NGN");
    const pdfCell = (value: ExportCell, kind: ExportColumn<TRow>["kind"]): string => {
        if (value === null || value === undefined) return "";
        if (value instanceof Date) return value.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
        if (typeof value === "number" && kind === "money") return value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (typeof value === "number") return value.toLocaleString("en-NG");
        return naira(value);
    };

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(naira(options.title), 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`${rows.length.toLocaleString("en-NG")} ${rows.length === 1 ? "row" : "rows"}, exported ${new Date().toLocaleString("en-NG")}`, 40, 56);
    autoTable(doc, {
        startY: 70,
        head: [shown.map((column) => naira(column.header))],
        body: rows.map((row) => shown.map((column) => pdfCell(column.value(row), column.kind))),
        styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [8, 120, 62], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 246] },
        columnStyles: Object.fromEntries(
            shown.flatMap((column, index) => (column.kind === "money" || column.kind === "number" ? [[index, { halign: "right" as const }]] : [])),
        ),
        margin: { left: 40, right: 40 },
        didDrawPage: () => {
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(140);
            doc.text(`Page ${pageCount}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
        },
    });
    doc.save(`${options.filename}.pdf`);
}

/** Saves `rows` as a file in `options.format`. */
export async function exportRows<TRow>(rows: TRow[], columns: ExportColumn<TRow>[], options: ExportOptions): Promise<void> {
    if (options.format === "csv") return downloadCsv(toCsv(rows, columns), options.filename);
    if (options.format === "pdf") return exportPdf(rows, columns, options);
    return exportSpreadsheet(rows, columns, { ...options, format: options.format });
}
