"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { DataTable, downloadCsv, toCsv, type ColumnDef } from "@/components/customTable";
import ProductImportForm from "@/components/manufacturerPlatform/form/productImportForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import type { ProductImportReport, SellerShopApi } from "@/lib/services/shopService";
import { exportFilename, productTemplateColumns } from "./shopTransfer";

const PRIMARY_BUTTON_CLASS = "h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer";
const SECONDARY_BUTTON_CLASS = "h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer";

type ReportRow = ProductImportReport["rows"][number] & { id: string };

const ACTION_LABELS: Record<ReportRow["action"], string> = { create: "New draft", update: "Change", unchanged: "No change" };

const REPORT_COLUMNS: ColumnDef<ReportRow>[] = [
    { key: "line", header: "Line", cell: (row) => <span className="text-mist-500">{row.line}</span> },
    { key: "title", header: "Product", cell: (row) => <span className="block max-w-48 truncate font-medium text-mist-950">{row.title || "(no title)"}</span> },
    { key: "action", header: "Would be", cell: (row) => <span className="whitespace-nowrap">{ACTION_LABELS[row.action]}</span> },
    {
        key: "errors",
        header: "What to fix",
        cell: (row) => (
            <ul className="flex min-w-56 max-w-96 flex-col gap-0.5 whitespace-normal text-xs text-red-700">
                {Object.entries(row.errors).flatMap(([column, messages]) =>
                    messages.map((message) => (
                        <li key={`${column}:${message}`}>
                            <span className="font-medium">{column}:</span> {message}
                        </li>
                    )),
                )}
            </ul>
        ),
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// ProductImportDialog: adding and changing products from a CSV file. Three
// steps: download the template (made from the seller's delivery zones), choose
// a file and check it (a dry run: nothing is saved), then import it once the
// check finds no problems. Rows without an ID become drafts; rows with one
// change that product. Photos and listing stay on each product.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductImportDialog({
    open,
    onOpenChange,
    api,
    zones,
    onImported,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    api: SellerShopApi;
    zones: { id: string; name: string }[];
    onImported: () => Promise<unknown>;
}) {
    const [checked, setChecked] = useState<{ csv: string; fileName: string; report: ProductImportReport } | null>(null);
    const [importing, setImporting] = useState(false);

    const close = () => {
        onOpenChange(false);
        setChecked(null);
    };

    const downloadTemplate = () => downloadCsv(toCsv([], productTemplateColumns(zones)), exportFilename("product-import-template"));

    const runImport = async () => {
        if (!checked) return;
        setImporting(true);
        try {
            const report = await api.importProducts(checked.csv, false);
            if (!report.applied) {
                // Something changed since the check (e.g. a product was edited): show the new findings
                setChecked({ ...checked, report });
                toast.error("The file has problems now. Fix them and check it again.");
                return;
            }
            await onImported();
            const { create, update } = report.summary;
            toast.success(`Imported: ${create} new ${create === 1 ? "draft" : "drafts"}, ${update} ${update === 1 ? "product" : "products"} changed`);
            close();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't import the file. Please try again."));
        } finally {
            setImporting(false);
        }
    };

    const report = checked?.report;
    const problemRows: ReportRow[] = (report?.rows ?? []).filter((row) => Object.keys(row.errors).length > 0).map((row) => ({ ...row, id: String(row.line) }));
    const ready = !!report && report.fileErrors.length === 0 && report.summary.withErrors === 0;
    const toApply = report ? report.summary.create + report.summary.update : 0;

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : !importing && close())}>
            <DialogContent className="max-w-180">
                <div className="flex flex-col gap-1">
                    <DialogTitle>Import products from CSV</DialogTitle>
                    <DialogDescription>
                        Rows without an ID are added as drafts. Rows with an ID change that product, but only the columns in the file. Add photos and list
                        each product afterwards.
                    </DialogDescription>
                </div>

                {!checked ? (
                    <div className="flex flex-col gap-5">
                        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-mist-50 px-4 py-3">
                            <p className="max-w-md text-sm font-text text-mist-700">
                                Start from the template, or export your products and edit that file. Prices are in naira; leave Stock blank for made to order.
                            </p>
                            <Button type="button" onClick={downloadTemplate} className={`${SECONDARY_BUTTON_CLASS} gap-2 bg-white border border-border`}>
                                <Download className="size-4" aria-hidden />
                                Download template
                            </Button>
                        </section>
                        <ProductImportForm
                            onCancel={close}
                            onCheck={async (csv, fileName) => {
                                setChecked({ csv, fileName, report: await api.importProducts(csv, true) });
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div
                            className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-text ${ready ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                            role="status"
                        >
                            {ready ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
                            <div className="flex flex-col gap-1">
                                <p className="font-medium">
                                    {checked.fileName}: {report!.summary.rows} {report!.summary.rows === 1 ? "row" : "rows"}.{" "}
                                    {ready ? "Ready to import." : "Fix the problems below in your spreadsheet, save it as CSV and check it again."}
                                </p>
                                <p>
                                    {report!.summary.create} new, {report!.summary.update} changed, {report!.summary.unchanged} unchanged
                                    {report!.summary.withErrors > 0 && `, ${report!.summary.withErrors} with problems`}.
                                </p>
                                {report!.fileErrors.length > 0 && (
                                    <ul className="list-disc pl-5">
                                        {report!.fileErrors.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {problemRows.length > 0 && (
                            <div className="max-h-80 overflow-y-auto">
                                <DataTable tableId="product-import-report" columns={REPORT_COLUMNS} rows={problemRows} compact />
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button type="button" onClick={() => setChecked(null)} disabled={importing} className={SECONDARY_BUTTON_CLASS}>
                                Choose another file
                            </Button>
                            {ready && (
                                <Button type="button" onClick={() => void runImport()} disabled={importing || toApply === 0} className={`${PRIMARY_BUTTON_CLASS} gap-2`}>
                                    {importing && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                    {importing ? "Importing..." : toApply === 0 ? "Nothing to change" : `Import ${toApply} ${toApply === 1 ? "product" : "products"}`}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
