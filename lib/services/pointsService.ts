import { api } from "@/lib/api";
import type { DeliveryDisputeRecord, PointEntryRecord, RankProgression } from "@/constant/points";

export interface PointsSummaryResponse {
    points: number;
    rank: string;
    completedJobs: number;
    /** Null before anyone has rated them. */
    averageRating: number | null;
    progression: RankProgression;
}

export interface PointsHistoryResponse {
    entries: PointEntryRecord[];
    nextBefore: string | null;
}

export interface SubmitDisputePayload {
    jobId: string;
    rejectionId: string;
    reason: string;
    attachments?: Array<{ publicId: string; name: string }>;
}

export interface ResolveDisputePayload {
    decision: "upheld" | "dismissed";
    note?: string;
}

export const pointsService = {
    /** Get current user's points, rank, and progression */
    async getMyPoints(): Promise<PointsSummaryResponse> {
        const { data } = await api.get<{ summary: PointsSummaryResponse }>("/points/me");
        return data.summary;
    },

    /** Get current user's paginated points log */
    async getMyHistory(params?: { limit?: number; before?: string }): Promise<PointsHistoryResponse> {
        const { data } = await api.get<PointsHistoryResponse>("/points/me/history", { params });
        return data;
    },

    /** Staff view: get specific user's point history */
    async getUserHistory(userId: string, params?: { limit?: number; before?: string }): Promise<PointsHistoryResponse> {
        const { data } = await api.get<PointsHistoryResponse>(`/points/users/${encodeURIComponent(userId)}/history`, { params });
        return data;
    },

    /** Submit a dispute for delivery point deduction within 48h */
    async submitDeliveryDispute(payload: SubmitDisputePayload): Promise<DeliveryDisputeRecord> {
        const { data } = await api.post<{ dispute: DeliveryDisputeRecord }>("/points/delivery-disputes", payload);
        return data.dispute;
    },

    /** Super Admin action: uphold (refund points) or dismiss a dispute */
    async resolveDeliveryDispute(disputeId: string, payload: ResolveDisputePayload): Promise<DeliveryDisputeRecord> {
        const { data } = await api.post<{ dispute: DeliveryDisputeRecord }>(
            `/points/delivery-disputes/${disputeId}/resolve`,
            payload,
        );
        return data.dispute;
    },
};
