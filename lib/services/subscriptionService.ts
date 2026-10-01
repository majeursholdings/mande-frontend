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

/** Where to send the manufacturer to pay (the payment partner's hosted checkout). */
export interface CheckoutResponse {
  checkoutUrl: string;
  reference: string;
}

/** A plan payment, as the API shows it. */
export interface SubscriptionPayment {
  id: string;
  reference: string;
  kind: "signup" | "renewal" | "upgrade";
  planId: string;
  billingCycle: "monthly" | "annual";
  amountKobo: number;
  status: "pending" | "succeeded" | "failed";
  failureReason: string | null;
  paidAt: string | null;
}

/** The manufacturer's plan, saved cards and recent plan payments, as every plan route answers. */
export interface SubscriptionView {
  subscription: {
    planId: string;
    billingCycle: "monthly" | "annual";
    status: "active" | "past_due" | "pending_payment" | "cancelled";
    currentPeriodStart: string | null;
    renewsAt: string | null;
    renewalsPaidFrom: "wallet" | "card";
    renewalCardId: string | null;
    scheduledPlanId: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  cards: { id: string; brand: string; last4: string; expiry: string; provider: string }[];
  payments: SubscriptionPayment[];
}

export const subscriptionService = {
  async getSubscription(): Promise<SubscriptionView> {
    const { data } = await api.get<SubscriptionView>("/subscription");
    return data;
  },

  async startCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
    const { data } = await api.post<CheckoutResponse>("/subscription/checkout", payload);
    return data;
  },

  /** Checks a card payment with the payment partner (after coming back from checkout). */
  async confirmPayment(reference: string): Promise<{ payment: SubscriptionPayment | null } & SubscriptionView> {
    const { data } = await api.post<{ payment: SubscriptionPayment | null } & SubscriptionView>(
      `/subscription/payments/${encodeURIComponent(reference)}/confirm`
    );
    return data;
  },

  /** Paid from a new card, it answers with the checkout to send them to (`checkoutUrl`). */
  async upgradePlan(
    payload: UpgradePlanPayload
  ): Promise<{ payment: SubscriptionPayment | null; checkoutUrl: string | null } & SubscriptionView> {
    const { data } = await api.post<{ payment: SubscriptionPayment | null; checkoutUrl: string | null } & SubscriptionView>(
      "/subscription/upgrade",
      payload
    );
    return data;
  },

  async scheduleDowngrade(planId: string): Promise<SubscriptionView> {
    const { data } = await api.post<SubscriptionView>("/subscription/downgrade", { planId });
    return data;
  },

  async keepCurrentPlan(): Promise<SubscriptionView> {
    const { data } = await api.post<SubscriptionView>("/subscription/keep");
    return data;
  },

  async cancelPlan(): Promise<SubscriptionView> {
    const { data } = await api.post<SubscriptionView>("/subscription/cancel");
    return data;
  },

  async setRenewalSource(payload: { from: "wallet" } | { from: "card"; cardId: string }): Promise<SubscriptionView> {
    const { data } = await api.put<SubscriptionView>("/subscription/renewals", payload);
    return data;
  },

  async removeCard(cardId: string): Promise<SubscriptionView> {
    const { data } = await api.delete<SubscriptionView>(`/subscription/cards/${cardId}`);
    return data;
  },
};
