import { api } from "@/lib/api";
import type { MachineBookingUnit } from "@/lib/services/machineBookingService";

// ─────────────────────────────────────────────────────────────────────────────
// The machine catalogue: the factory machines makers book time on. Super
// admins add them with a photo, what they do and a price per hour and/or per
// day (whole kobo). The machine booking unit decides which price applies; a
// machine with no price for that unit can't be booked. Machines are never
// deleted: deactivate one to take it off the booking form.
// ─────────────────────────────────────────────────────────────────────────────

export type MachineImage = { url: string; publicId: string };

export type Machine = {
    id: string;
    /** 2 to 80 characters. */
    name: string;
    image: MachineImage | null;
    /** Null when it isn't offered by the hour; at least 100 otherwise. */
    hourlyPriceKobo: number | null;
    /** Null when it isn't offered by the day; at least 100 otherwise. */
    dailyPriceKobo: number | null;
    /** 1 to 10 items, each 2 to 60 characters, e.g. "Panel cutting". */
    functions: string[];
    /** 2 to 60 characters, free text, e.g. "Cutting". */
    category: string;
    /** Up to 80 characters, e.g. "Felder K 940". */
    model: string | null;
    /** Up to 60 characters, e.g. "CNC". */
    type: string | null;
    /** Up to 500 characters. */
    description: string | null;
    active: boolean;
    /** Lower first. */
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type MachineStatusFilter = "active" | "inactive";

export type MachinePage = { machines: Machine[]; nextBefore: string | null };

export type MachineListParams = {
    status?: MachineStatusFilter;
    q?: string;
    limit?: number;
    before?: string;
};

export type CreateMachinePayload = {
    name: string;
    /** From an upload with media purpose "machine-image". */
    image: { publicId: string } | null;
    hourlyPriceKobo: number | null;
    dailyPriceKobo: number | null;
    functions: string[];
    category: string;
    model: string | null;
    type: string | null;
    description: string | null;
    active?: boolean;
    sortOrder?: number;
};

/** Any create field; `image: null` removes the photo. */
export type UpdateMachinePayload = Partial<CreateMachinePayload>;

export const MACHINE_LIMITS = {
    nameMax: 80,
    functionsMax: 10,
    functionMin: 2,
    functionMax: 60,
    categoryMax: 60,
    modelMax: 80,
    typeMax: 60,
    descriptionMax: 500,
    /** The lowest price, in kobo (₦1). */
    priceMinKobo: 100,
} as const;

/** A machine's price for a unit, or null when it isn't offered that way. */
export function getMachinePrice(machine: Pick<Machine, "hourlyPriceKobo" | "dailyPriceKobo">, unit: MachineBookingUnit) {
    return unit === "day" ? machine.dailyPriceKobo : machine.hourlyPriceKobo;
}

export const machineService = {
    async listMachines(params: MachineListParams = {}): Promise<MachinePage> {
        const { data } = await api.get<MachinePage>("/machines", { params });
        return { machines: data.machines ?? [], nextBefore: data.nextBefore ?? null };
    },

    async createMachine(payload: CreateMachinePayload): Promise<Machine> {
        const { data } = await api.post<{ machine: Machine }>("/machines", payload);
        return data.machine;
    },

    async updateMachine(id: string, payload: UpdateMachinePayload): Promise<Machine> {
        const { data } = await api.patch<{ machine: Machine }>(`/machines/${encodeURIComponent(id)}`, payload);
        return data.machine;
    },

    /** The categories already used, for suggestions. */
    async getCategories(): Promise<string[]> {
        const { data } = await api.get<{ categories: string[] }>("/machines/categories");
        return data.categories ?? [];
    },
};
