import type { StatusTone } from "@/components/customTable";
import type { CreditEntryKind, CustomerOrderStatus, CustomerStatus, CustomerStatusFilter } from "@/lib/services/customerService";

// How a customer's account, orders and store credit entries read on the
// Customers pages.

export const CUSTOMER_STATUS: Record<CustomerStatus, { label: string; tone: StatusTone }> = {
    active: { label: "Active", tone: "green" },
    pending_verification: { label: "Unverified", tone: "amber" },
    deactivated: { label: "Deactivated", tone: "red" },
    disabled: { label: "Disabled", tone: "gray" },
};

export const CUSTOMER_STATUS_FILTER_ITEMS: { value: CustomerStatusFilter; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "pending_verification", label: "Unverified" },
    { value: "deactivated", label: "Deactivated" },
];

export const isCustomerStatusFilter = (value: string): value is CustomerStatusFilter =>
    CUSTOMER_STATUS_FILTER_ITEMS.some((item) => item.value === value);

export const CUSTOMER_ORDER_STATUS: Record<CustomerOrderStatus, { label: string; tone: StatusTone }> = {
    pending_payment: { label: "Not paid yet", tone: "amber" },
    paid: { label: "Paid", tone: "green" },
    cancelled: { label: "Cancelled", tone: "gray" },
    expired: { label: "Payment not completed", tone: "gray" },
};

export const CREDIT_ENTRY_KIND_LABELS: Record<CreditEntryKind, string> = {
    refund: "Refund",
    spent: "Spent",
    released: "Given back",
    adjustment: "Adjustment",
};
