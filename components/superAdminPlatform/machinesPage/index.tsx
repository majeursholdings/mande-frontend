"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DataTable, TableToolbar, ToolbarActionButton } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { machineService, type Machine, type MachineStatusFilter } from "@/lib/services/machineService";
import MachineForm from "../form/machineForm";
import { MACHINE_COLUMNS, MACHINE_STATUS_ITEMS } from "./machineParts";
import SuperAdminMachinesOverview from "./superAdminMachinesOverview";

const TABLE_ID = "machines";
const PAGE_SIZE = 20;

const PRIMARY_BUTTON_CLASS =
    "h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer";
const SECONDARY_BUTTON_CLASS =
    "h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer";

// ─────────────────────────────────────────────────────────────────────────────
// MachinesPage: the factory machines makers book time on. Each has a photo,
// what it does and a price per hour and/or per day; the machine booking unit
// (in Settings) decides which price applies. Searched and filtered on the
// API, paged by date ("Show more machines" loads the next page). Machines are
// never deleted: deactivate one to take it off the booking form. Bookings
// already made keep the machine as it was. Shared by the admin and super
// admin platforms: only super admins run Settings, so the copy says so.
// ─────────────────────────────────────────────────────────────────────────────

export default function MachinesPage() {
    const queryClient = useQueryClient();
    const platform = useStaffPlatform();
    const searchParams = useSearchParams();
    const [isCreating, setIsCreating] = useState(false);
    const [editing, setEditing] = useState<Machine | null>(null);
    const [deactivating, setDeactivating] = useState<Machine | null>(null);
    const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

    // The toolbar keeps its search and filter in the URL, under the table's id
    const q = (searchParams.get(`${TABLE_ID}_search`) ?? "").trim();
    const statusParam = searchParams.get(`${TABLE_ID}_status`) ?? "";
    const status = MACHINE_STATUS_ITEMS.some((item) => item.value === statusParam)
        ? (statusParam as MachineStatusFilter)
        : undefined;

    const query = useInfiniteQuery({
        queryKey: queryKeys.machines.list({ q, status: status ?? null }),
        queryFn: ({ pageParam }) =>
            machineService.listMachines({ q: q || undefined, status, limit: PAGE_SIZE, before: pageParam ?? undefined }),
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
        staleTime: 30_000,
    });

    const rows: Machine[] = query.data?.pages.flatMap((page) => page.machines) ?? [];
    const isFiltered = !!q || !!status;

    // A change to the catalogue changes what can be booked, and the categories in use
    const refresh = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.machines.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.machineBookings.pricing() }),
        ]);

    const setActive = async (machine: Machine, active: boolean) => {
        setIsTogglingId(machine.id);
        try {
            await machineService.updateMachine(machine.id, { active });
            await refresh();
            toast.success(active ? `${machine.name} is active` : `${machine.name} is deactivated`);
            setDeactivating(null);
        } catch (err) {
            toast.error(
                getErrorMessage(
                    err,
                    active ? "Couldn't activate the machine. Please try again." : "Couldn't deactivate the machine. Please try again.",
                ),
            );
        } finally {
            setIsTogglingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Machines"
                description={
                    platform.permissions.managesPlatform
                        ? "The factory machines makers book time on. Makers pick up to the most machines per booking set in Settings, and pay each machine's price per hour or per day."
                        : "The factory machines makers book time on. Makers pick up to the most machines per booking a super admin sets, and pay each machine's price per hour or per day."
                }
            />

            {/* Bookings and their money are the super admin's reports */}
            {platform.key === "super-admin" && <SuperAdminMachinesOverview />}

            <div className="flex flex-col">
                <DataTable
                    tableId={TABLE_ID}
                    columns={MACHINE_COLUMNS}
                    rows={rows}
                    loading={query.isPending}
                    error={query.isError ? "We couldn't load the machines. Please refresh the page." : undefined}
                    emptyMessage={
                        isFiltered ? "No machines match your search." : "No machines yet. Add one so makers can book it."
                    }
                    onRowClick={setEditing}
                    rowActions={[
                        { label: "Edit", onSelect: setEditing },
                        {
                            label: "Activate",
                            onSelect: (machine) => void setActive(machine, true),
                            hidden: (machine) => machine.active,
                            disabledReason: (machine) => (isTogglingId === machine.id ? "Saving..." : null),
                        },
                        {
                            label: "Deactivate",
                            tone: "danger",
                            onSelect: setDeactivating,
                            hidden: (machine) => !machine.active,
                        },
                    ]}
                    toolbar={
                        <TableToolbar
                            search={{ placeholder: "Search name, model, category or function" }}
                            filters={[{ title: "All statuses", paramKey: "status", items: MACHINE_STATUS_ITEMS }]}
                            actions={<ToolbarActionButton label="New machine" onClick={() => setIsCreating(true)} />}
                        />
                    }
                />
                {query.hasNextPage && (
                    <button
                        type="button"
                        onClick={() => void query.fetchNextPage()}
                        disabled={query.isFetchingNextPage}
                        className="mt-4 self-center text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60 cursor-pointer"
                    >
                        {query.isFetchingNextPage ? "Loading..." : "Show more machines"}
                    </button>
                )}
            </div>

            <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
                <DialogContent className="max-w-140">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>New machine</DialogTitle>
                        <DialogDescription>
                            Makers can book it as soon as it&apos;s active and has a price for the booking unit.
                        </DialogDescription>
                    </div>
                    {isCreating && (
                        <MachineForm
                            onCancel={() => setIsCreating(false)}
                            onCreate={async (payload) => {
                                const machine = await machineService.createMachine(payload);
                                await refresh();
                                toast.success(`${machine.name} is added`);
                                setIsCreating(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="max-w-140">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Edit {editing?.name}</DialogTitle>
                        <DialogDescription>
                            Changes apply to new bookings. Bookings already made keep the machine and price they were made with.
                        </DialogDescription>
                    </div>
                    {editing && (
                        <MachineForm
                            key={editing.id}
                            machine={editing}
                            onCancel={() => setEditing(null)}
                            onUpdate={async (payload) => {
                                const machine = await machineService.updateMachine(editing.id, payload);
                                await refresh();
                                toast.success(`${machine.name} is saved`);
                                setEditing(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!deactivating} onOpenChange={(open) => !open && !isTogglingId && setDeactivating(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Deactivate {deactivating?.name}?</DialogTitle>
                        <DialogDescription>
                            It comes off the booking form until it&apos;s activated again. Bookings already made aren&apos;t affected.
                        </DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => setDeactivating(null)}
                            disabled={!!isTogglingId}
                            className={SECONDARY_BUTTON_CLASS}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => deactivating && void setActive(deactivating, false)}
                            disabled={!!isTogglingId}
                            className={`${PRIMARY_BUTTON_CLASS} gap-2`}
                        >
                            {isTogglingId && <Loader2 className="size-4 animate-spin" />}
                            {isTogglingId ? "Deactivating..." : "Deactivate"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
