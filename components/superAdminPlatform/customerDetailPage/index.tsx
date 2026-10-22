"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Clock, Mail, MailCheck, MapPin, Megaphone, Phone, UserX } from "lucide-react";
import { StatusBadge } from "@/components/customTable";
import { LoadError } from "@/components/adminPlatform/emptyState";
import { Button } from "@/components/ui/button";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/ui/userAvatar";
import { SUPER_ADMIN_CUSTOMERS_URL } from "@/constant/superAdmin";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService } from "@/lib/services/customerService";
import { CUSTOMER_STATUS } from "../customersPage/customerStatus";
import CustomerAccountDialog from "./customerAccountDialog";
import CustomerCredit from "./customerCredit";
import CustomerOrders from "./customerOrders";

type CustomerTab = "orders" | "credit" | "addresses";

// ─────────────────────────────────────────────────────────────────────────────
// One shop customer, for super admins: who they are, their orders, their
// store credit statement and saved addresses (all read only), and
// deactivating or reactivating the account.
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage({ customerId }: { customerId: string }) {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const query = useQuery({
        queryKey: queryKeys.customers.detail(customerId),
        queryFn: () => customerService.getCustomer(customerId),
        staleTime: 30_000,
    });
    const customer = query.data;

    if (query.isPending) {
        return (
            <div className="flex flex-col gap-6" aria-busy="true">
                <div className="flex items-center gap-3">
                    <Link href={SUPER_ADMIN_CUSTOMERS_URL} className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white text-mist-600 hover:bg-mist-50" title="Back to customers">
                        <ArrowLeft className="size-4" />
                    </Link>
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="flex flex-col gap-6 lg:flex-row">
                    <Skeleton className="h-72 rounded-xl lg:w-72" />
                    <Skeleton className="h-72 flex-1 rounded-xl" />
                </div>
            </div>
        );
    }

    if (query.isError || !customer) {
        return (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
                <LoadError message="We couldn't find this customer. They may not exist, or the page didn't load. Please try again." />
                <Link href={SUPER_ADMIN_CUSTOMERS_URL} className="flex items-center gap-1.5 text-xs font-medium text-secondary-700 hover:underline">
                    <ArrowLeft className="size-3.5" /> Back to Customers
                </Link>
            </div>
        );
    }

    const status = CUSTOMER_STATUS[customer.status];
    const isDeactivated = customer.status === "deactivated";

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href={SUPER_ADMIN_CUSTOMERS_URL} className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white text-mist-600 transition-colors hover:bg-mist-50" title="Back to customers">
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold font-text text-mist-950">{customer.name}</h1>
                        <p className="text-xs font-text text-mist-500">Shop customer since {dayjs(customer.joinedAt).format("D MMM YYYY")}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={status.label} tone={status.tone} variant="pill" />
                    <Button
                        type="button"
                        onClick={() => setDialogOpen(true)}
                        className={
                            isDeactivated
                                ? "h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                                : "h-10 px-4 bg-error-600 hover:bg-error-700 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                        }
                    >
                        {isDeactivated ? "Reactivate account" : "Deactivate account"}
                    </Button>
                </div>
            </div>

            {isDeactivated && (
                <div role="status" className="flex gap-3 rounded-xl border border-error-100 bg-error-50 px-4 py-3">
                    <UserX className="mt-0.5 size-4 shrink-0 text-error-600" strokeWidth={1.75} aria-hidden />
                    <p className="text-sm font-text text-error-700">
                        <span className="font-medium">This account is deactivated.</span> {customer.name} can&apos;t sign in on the shop.
                        {customer.deactivation &&
                            ` Deactivated by ${customer.deactivation.byName} on ${dayjs(customer.deactivation.at).format("D MMM YYYY")}: ${customer.deactivation.reason}`}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-5 shadow-xs lg:w-72 lg:shrink-0">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <UserAvatar name={customer.name} className="size-20 text-lg shadow-xs" />
                        <div>
                            <h2 className="text-base font-semibold font-text text-mist-950">{customer.name}</h2>
                            <p className="text-xs font-text text-mist-500">Customer</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border pt-4 text-xs font-text text-mist-700">
                        <InfoLine icon={Mail}>
                            <span className="truncate">{customer.email}</span>
                        </InfoLine>
                        <InfoLine icon={Phone}>{customer.phone || "No phone number"}</InfoLine>
                        <InfoLine icon={MailCheck}>{customer.emailVerified ? "Email verified" : "Email not verified yet"}</InfoLine>
                        <InfoLine icon={Megaphone}>{customer.marketingOptIn ? "Gets marketing emails" : "No marketing emails"}</InfoLine>
                        <InfoLine icon={Clock}>
                            {customer.lastLoginAt ? `Last signed in ${dayjs(customer.lastLoginAt).format("D MMM YYYY")}` : "Never signed in"}
                        </InfoLine>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 text-center text-xs">
                        <Figure label="Orders" value={customer.ordersCount.toLocaleString()} />
                        <Figure label="Spent" value={formatPrice(fromKobo(customer.spentKobo))} />
                        <Figure label="Store credit" value={formatPrice(fromKobo(customer.creditKobo))} />
                        <Figure label="On the way" value={customer.inFlight.openOrders.toLocaleString()} />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <ResponsiveTabs<CustomerTab>
                        label={`${customer.name}'s details`}
                        defaultValue="orders"
                        tabs={[
                            { value: "orders", label: "Orders", panel: <CustomerOrders customerId={customer.id} /> },
                            { value: "credit", label: "Store credit", panel: <CustomerCredit customerId={customer.id} /> },
                            {
                                value: "addresses",
                                label: `Addresses (${customer.addresses.length})`,
                                panel:
                                    customer.addresses.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
                                            <p className="text-xs font-text text-mist-500">They haven&apos;t saved a delivery address yet.</p>
                                        </div>
                                    ) : (
                                        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {customer.addresses.map((address) => (
                                                <li key={address.id} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm font-text">
                                                    <MapPin className="mt-0.5 size-4 shrink-0 text-mist-400" aria-hidden />
                                                    <div className="flex min-w-0 flex-col gap-0.5">
                                                        <span className="flex items-center gap-2 font-medium text-mist-950">
                                                            {address.label || "Address"}
                                                            {address.isDefault && <StatusBadge label="Default" tone="blue" variant="pill" />}
                                                        </span>
                                                        <span className="text-mist-700">
                                                            {address.name}, {address.phone}
                                                        </span>
                                                        <span className="text-mist-600">
                                                            {address.street}, {address.city}, {address.state}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ),
                            },
                        ]}
                    />
                </div>
            </div>

            <CustomerAccountDialog
                customer={customer}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onDone={() => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })}
            />
        </div>
    );
}

function InfoLine({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2.5">
            <Icon className="size-3.5 shrink-0 text-mist-400" />
            {children}
        </div>
    );
}

function Figure({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-mist-400">{label}</span>
            <span className="block truncate text-sm font-bold tabular-nums text-mist-900" title={value}>
                {value}
            </span>
        </div>
    );
}
