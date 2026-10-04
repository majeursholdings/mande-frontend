"use client";

import { useState } from "react";
import { Check, CircleCheck, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import { API_BASE_URL } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/adminPlatform/emptyState";
import { API_KEY_GROUPS, API_PROVIDERS, type ApiKey, type ApiProvider } from "@/constant/superAdmin";
import ApiKeyForm, { type ApiKeyDraft } from "../form/apiKeyForm";
import ReauthSteps from "../reauthSteps";
import { useSuperAdminSettings } from "../settingsContext";

/** A public key, shortened to its start and end. */
const shortKey = (key: string) => (key.length > 24 ? `${key.slice(0, 14)}…${key.slice(-4)}` : key);

const providerLabel = (provider: ApiProvider) =>
    API_PROVIDERS.find((option) => option.value === provider)?.label ?? provider;

/** What switching to a set means: real payments (or checks) through this account, or the platform's test mode. */
function switchDescription(key: ApiKey): string {
    const label = providerLabel(key.provider);
    const isPayments = API_PROVIDERS.find((option) => option.value === key.provider)?.group === "payments";
    if (key.mode === "live") {
        return isPayments ? `Payments through ${label} go to this account from now on.` : `${label} checks run on this account from now on.`;
    }
    return isPayments
        ? `${label} switches to test mode: payments through it are pretend, and no real money moves.`
        : `${label} switches to its sandbox: checks are pretend, and manufacturers aren't really verified.`;
}

type KeyDialog =
    | { kind: "add"; provider: ApiProvider }
    | { kind: "activate"; key: ApiKey }
    | { kind: "remove"; key: ApiKey }
    | null;

// ─────────────────────────────────────────────────────────────────────────────
// ApiKeysTab — the keys for every platform Mande connects to, a section per
// kind (Payments: Paystack and Flutterwave; Identity checks: Youverify). A platform can hold
// several sets of keys, live or test, and uses the one that's active: pick
// another to switch. Adding a set and removing one both need your password
// and a one-time code first.
// ─────────────────────────────────────────────────────────────────────────────

export default function ApiKeysTab() {
    const { apiKeys, addApiKey, setActiveApiKey, removeApiKey, sectionStatus } = useSuperAdminSettings();
    const { isLoading, isError } = sectionStatus.apiKeys;
    // Couldn't load them, and there are none from before to show
    const hasFailed = isError && apiKeys.length === 0;
    const [dialog, setDialog] = useState<KeyDialog>(null);
    const [draft, setDraft] = useState<ApiKeyDraft | null>(null);
    const close = () => {
        setDialog(null);
        setDraft(null);
    };
    const keysFor = (provider: ApiProvider) => apiKeys.filter((key) => key.provider === provider);

    return (
        <div className="flex flex-col gap-6">
            <p className="-mt-3 text-sm font-text text-mist-500">
                Keys come from each platform&apos;s dashboard. You&apos;ll confirm it&apos;s you with your password and a
                one-time code before a set is added or removed.
            </p>

            {hasFailed && (
                <LoadError message="We couldn't load the API keys. Please refresh the page." />
            )}

            {API_KEY_GROUPS.map((group) => (
                <SettingsSection key={group.value} headingLevel="h3" title={group.label} description={group.description}>
                    <div className="flex flex-col gap-4">
                        {API_PROVIDERS.filter((provider) => provider.group === group.value).map((provider) => {
                            const keys = keysFor(provider.value);
                            const active = keys.find((key) => key.isActive);
                            return (
                                <section
                                    key={provider.value}
                                    className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-col gap-0.5">
                                            <h4 className="flex items-center gap-2 text-base font-semibold font-text text-mist-950">
                                                {provider.label}
                                                {isLoading ? (
                                                    <Skeleton className="h-4.5 w-20 rounded-full" />
                                                ) : (
                                                    !hasFailed && <ProviderStatus active={active} />
                                                )}
                                            </h4>
                                            <p className="text-sm font-text text-mist-500">{provider.description}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDialog({ kind: "add", provider: provider.value })}
                                            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                                        >
                                            <Plus className="size-3.5" aria-hidden />
                                            Add keys
                                        </button>
                                    </div>

                                    {provider.webhook && (
                                        <WebhookUrl
                                            label={provider.label}
                                            url={`${API_BASE_URL}${provider.webhook.path}`}
                                            where={provider.webhook.where}
                                        />
                                    )}

                                    {isLoading ? (
                                        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border" aria-busy="true">
                                            {Array.from({ length: 2 }).map((_, index) => (
                                                <li key={index} className="flex items-center gap-4 px-4 py-3">
                                                    <KeyRound className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3.5 w-56" />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : hasFailed ? null : keys.length === 0 ? (
                                        <p className="rounded-lg bg-mist-50 px-4 py-5 text-center text-sm font-text text-mist-500">
                                            No keys yet.
                                        </p>
                                    ) : (
                                        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                                            {keys.map((key) => (
                                                <KeyRow
                                                    key={key.id}
                                                    apiKey={key}
                                                    onActivate={() => setDialog({ kind: "activate", key })}
                                                    onRemove={() => setDialog({ kind: "remove", key })}
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </SettingsSection>
            ))}

            <Dialog open={!!dialog} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-w-110">
                    {dialog?.kind === "add" && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Add {providerLabel(dialog.provider)} keys</DialogTitle>
                                <DialogDescription>
                                    {draft
                                        ? `${draft.name} (${draft.mode}) is ready to save${draft.isActive ? ", and to use straight away" : ""}.`
                                        : `Paste them from your ${providerLabel(dialog.provider)} dashboard, under Settings.`}
                                </DialogDescription>
                            </div>
                            {draft ? (
                                <ReauthSteps
                                    confirmLabel="Add keys"
                                    onCancel={close}
                                    onConfirmed={async (reauthToken) => {
                                        try {
                                            await addApiKey(draft, reauthToken);
                                            toast.success(`${providerLabel(draft.provider)} keys added: ${draft.name}`);
                                            close();
                                        } catch {
                                            toast.error("Couldn't add the keys. Please try again.");
                                        }
                                    }}
                                />
                            ) : (
                                <ApiKeyForm
                                    provider={dialog.provider}
                                    takenNames={keysFor(dialog.provider).map((key) => key.name.toLowerCase())}
                                    hasActiveKey={keysFor(dialog.provider).some((key) => key.isActive)}
                                    onSubmit={setDraft}
                                    onCancel={close}
                                />
                            )}
                        </>
                    )}

                    {dialog?.kind === "activate" && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Use {dialog.key.name} for {providerLabel(dialog.key.provider)}?</DialogTitle>
                                <DialogDescription>
                                    {switchDescription(dialog.key)}{" "}
                                    The keys it replaces stay here, to switch back to.
                                </DialogDescription>
                            </div>
                            <ReauthSteps
                                confirmLabel="Use these keys"
                                onCancel={close}
                                onConfirmed={async (reauthToken) => {
                                    try {
                                        await setActiveApiKey(dialog.key.id, reauthToken);
                                        toast.success(`${providerLabel(dialog.key.provider)} now uses ${dialog.key.name}`);
                                        close();
                                    } catch {
                                        toast.error("Couldn't switch the keys. Please try again.");
                                    }
                                }}
                            />
                        </>
                    )}

                    {dialog?.kind === "remove" && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Remove {dialog.key.name}?</DialogTitle>
                                <DialogDescription>
                                    {dialog.key.isActive
                                        ? `These are the keys ${providerLabel(dialog.key.provider)} uses now. Without them it stops working until you make another set active.`
                                        : `${providerLabel(dialog.key.provider)} keeps using its active keys.`}
                                </DialogDescription>
                            </div>
                            <ReauthSteps
                                confirmLabel="Remove keys"
                                onCancel={close}
                                onConfirmed={async (reauthToken) => {
                                    try {
                                        await removeApiKey(dialog.key.id, reauthToken);
                                        toast.success(`${dialog.key.name} removed from ${providerLabel(dialog.key.provider)}`);
                                        close();
                                    } catch {
                                        toast.error("Couldn't remove the keys. Please try again.");
                                    }
                                }}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** The address a payment platform sends its payment updates to, to copy into its dashboard. */
function WebhookUrl({ label, url, where }: { label: string; url: string; where: string }) {
    const [copied, setCopied] = useState(false);
    // The platform's servers can't reach a local address, so updates never arrive there
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(url);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy it. Select the address and copy it instead.");
        }
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg bg-mist-50 px-4 py-3">
            <p className="text-xs font-medium font-text text-mist-900">Webhook URL</p>
            <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-xs text-mist-700">{url}</code>
                <button
                    type="button"
                    onClick={copy}
                    aria-label={`Copy the ${label} webhook URL`}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                >
                    {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <p className="text-xs font-text text-mist-500">
                Paste it on your {label} dashboard under {where}. {label} uses it to confirm payments, even when
                someone closes the page before they&apos;re sent back.
            </p>
            {isLocal && (
                <p className="text-xs font-text text-warning-700">
                    This is a local address, which {label} can&apos;t reach. Use the deployed API&apos;s address, or a
                    tunnel to this machine, to get updates while testing.
                </p>
            )}
        </div>
    );
}

/** Beside a platform's name: live, in test mode, or not connected (no active keys). */
function ProviderStatus({ active }: { active: ApiKey | undefined }) {
    const status = !active
        ? { label: "Not connected", className: "bg-mist-100 text-mist-600" }
        : active.mode === "live"
          ? { label: "Live", className: "bg-primary-50 text-primary-700" }
          : { label: "Test mode", className: "bg-warning-50 text-warning-700" };
    return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>{status.label}</span>;
}

function KeyRow({ apiKey, onActivate, onRemove }: { apiKey: ApiKey; onActivate: () => void; onRemove: () => void }) {
    return (
        <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3", apiKey.isActive && "bg-primary-50/40")}>
            <KeyRound className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium font-text text-mist-950">
                    {apiKey.name}
                    <span
                        className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase",
                            apiKey.mode === "live" ? "bg-primary-50 text-primary-700" : "bg-warning-50 text-warning-700",
                        )}
                    >
                        {apiKey.mode}
                    </span>
                    {apiKey.isActive && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary-700">
                            <CircleCheck className="size-3.5" aria-hidden />
                            Active
                        </span>
                    )}
                </p>
                {apiKey.publicKey && <p className="font-mono text-xs break-all text-mist-600">{shortKey(apiKey.publicKey)}</p>}
                <p className="text-xs font-text text-mist-500">
                    Secret <span className="font-mono">••••{apiKey.secretKeyLast4}</span>
                    {apiKey.hasEncryptionKey && " · encryption key set"}
                    {apiKey.hasWebhookSecret && " · webhook hash set"} · added by {apiKey.addedBy} on{" "}
                    {formatOrdinalDate(new Date(apiKey.addedAt))}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                {!apiKey.isActive && (
                    <button
                        type="button"
                        onClick={onActivate}
                        className="flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                    >
                        Make active
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium font-text text-error-600 transition-colors hover:bg-error-50 cursor-pointer"
                >
                    <Trash2 className="size-3.5" aria-hidden />
                    Remove
                </button>
            </div>
        </li>
    );
}
