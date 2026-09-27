"use client";

import type { ReactNode } from "react";
import { useManufacturerAccount } from "./manufacturerAccountContext";
import SuspendedAccountScreen from "./suspendedAccountScreen";

/**
 * The dashboard — or, while the account is suspended, only the suspended
 * screen, so nothing else on the account can be used (every page, form and
 * action is behind it). All that's left is sending an appeal.
 */
export default function AccountGate({ children }: { children: ReactNode }) {
    const { isSuspended } = useManufacturerAccount();
    return isSuspended ? <SuspendedAccountScreen /> : children;
}
