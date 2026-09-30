import { api } from "@/lib/api";

export interface UpgradePlanPayload {
  planId: string;
  pay:
    | { from: "wallet" }
    | { from: "card"; cardId: string }
    | { from: "new-card"; saveCard?: boolean; returnPath?: string };
}

export interface CheckoutPayload {
  planId: string;
  billingCycle: "monthly" | "annual";
  saveCard?: boolean;
  returnPath?: string;
}

export const subscriptionService = {
  async getSubscription() {
    const { data } = await api.get("/subscription");
    return data;
  },

  async startCheckout(payload: CheckoutPayload) {
    const { data } = await api.post("/subscription/checkout", payload);
    return data;
  },

  async confirmPayment(reference: string) {
    const { data } = await api.post(`/subscription/payments/${reference}/confirm`);
    return data;
  },

  async upgradePlan(payload: UpgradePlanPayload) {
    const { data } = await api.post("/subscription/upgrade", payload);
    return data;
  },

  async scheduleDowngrade(planId: string) {
    const { data } = await api.post("/subscription/downgrade", { planId });
    return data;
  },

  async keepCurrentPlan() {
    const { data } = await api.post("/subscription/keep");
    return data;
  },

  async cancelPlan() {
    const { data } = await api.post("/subscription/cancel");
    return data;
  },

  async setRenewalSource(payload: { from: "wallet" } | { from: "card"; cardId: string }) {
    const { data } = await api.put("/subscription/renewals", payload);
    return data;
  },

  async removeCard(cardId: string) {
    const { data } = await api.delete(`/subscription/cards/${cardId}`);
    return data;
  },
};
