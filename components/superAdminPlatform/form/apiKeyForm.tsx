"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import {
    API_KEY_GROUPS,
    API_KEY_MODE_OPTIONS,
    API_PROVIDERS,
    type ApiKey,
    type ApiKeyMode,
    type ApiProvider,
} from "@/constant/superAdmin";

type ApiKeyValues = {
    name: string;
    mode: ApiKeyMode;
    publicKey: string;
    secretKey: string;
    encryptionKey: string;
    webhookSecret: string;
    isActive: boolean;
};

/** What goes on to confirming it's you — the full secret only ever leaves in the request to the API. */
export type ApiKeyDraft = Omit<ApiKey, "id" | "addedBy" | "addedAt">;

const MIN_KEY_LENGTH = 20;

/**
 * A new set of keys for a platform: a name to tell it apart, live or test,
 * and the keys themselves, each checked against how the platform's keys
 * start for that mode, so a test key in the live box (or a secret in the
 * public one) is caught before it's saved. Only the fields the platform uses
 * are asked for (Youverify has no public key; Flutterwave also needs its
 * encryption key and webhook hash). It can take over as the active set
 * straight away; a platform's first set always does.
 */
export default function ApiKeyForm({
    provider,
    takenNames,
    hasActiveKey,
    onSubmit,
    onCancel,
}: {
    provider: ApiProvider;
    /** The platform's other sets' names, which this one can't repeat. */
    takenNames: string[];
    /** Whether the platform has an active set already. */
    hasActiveKey: boolean;
    onSubmit: (draft: ApiKeyDraft) => void;
    onCancel: () => void;
}) {
    const config = API_PROVIDERS.find((option) => option.value === provider) ?? API_PROVIDERS[0];
    const group = API_KEY_GROUPS.find((option) => option.value === config.group) ?? API_KEY_GROUPS[0];
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ApiKeyValues>({
        mode: "onTouched",
        defaultValues: { name: "", mode: "live", publicKey: "", secretKey: "", encryptionKey: "", webhookSecret: "", isActive: !hasActiveKey },
    });
    const mode = useWatch({ control: methods.control, name: "mode" }) ?? "live";
    const prefixes = config.keyPrefixes[mode];

    const keyRules = (label: string, prefix: string | null) => ({
        required: `Paste the ${label}`,
        validate: (value: string) => {
            const key = value.trim();
            if (prefix && !key.startsWith(prefix)) return `A ${mode} ${label} starts with ${prefix}`;
            if (/\s/.test(key)) return `The ${label} can't contain spaces`;
            return key.length >= MIN_KEY_LENGTH || `That ${label} looks too short`;
        },
    });

    const fields: FormFieldConfig[] = [
        {
            name: "name",
            type: "text",
            label: "Name",
            placeholder: "e.g. Main account",
            description: "To tell this set of keys apart from the others.",
            validation: {
                required: "Give the keys a name",
                validate: (value: string) => {
                    const name = value.trim().toLowerCase();
                    if (!name) return "Give the keys a name";
                    return !takenNames.includes(name) || `${config.label} already has keys with that name`;
                },
            },
        },
        {
            name: "mode",
            type: "radio",
            label: group.modeLabel,
            options: API_KEY_MODE_OPTIONS,
            description: group.modeDescriptions[mode],
            validation: { required: "Pick live or test" },
        },
        ...(config.hasPublicKey
            ? [
                  {
                      name: "publicKey",
                      type: "text",
                      label: "Public key",
                      placeholder: prefixes.publicKey ? `${prefixes.publicKey}...` : "Paste the public key",
                      autoComplete: "off",
                      validation: keyRules("public key", prefixes.publicKey),
                  } satisfies FormFieldConfig,
              ]
            : []),
        {
            name: "secretKey",
            type: "password",
            label: "Secret key",
            placeholder: prefixes.secretKey ? `${prefixes.secretKey}...` : "Paste the secret key",
            autoComplete: "new-password",
            description: "Only its last 4 characters show here once it's saved.",
            validation: keyRules("secret key", prefixes.secretKey),
        },
        ...(config.hasEncryptionKey
            ? [
                  {
                      name: "encryptionKey",
                      type: "password",
                      label: "Encryption key",
                      placeholder: "Paste the encryption key",
                      autoComplete: "new-password",
                      description: "Flutterwave uses it to encrypt card details.",
                      validation: {
                          required: "Paste the encryption key",
                          validate: (value: string) => value.trim().length >= 12 || "That encryption key looks too short",
                      },
                  } satisfies FormFieldConfig,
              ]
            : []),
        ...(config.hasWebhookSecret
            ? [
                  {
                      name: "webhookSecret",
                      type: "password",
                      label: "Webhook secret hash",
                      placeholder: "Paste the secret hash",
                      autoComplete: "new-password",
                      description: `The secret hash set under Webhooks on ${config.label}. It proves a payment update came from ${config.label}.`,
                      validation: {
                          required: "Paste the webhook secret hash",
                          validate: (value: string) => value.trim().length >= 8 || "That hash looks too short",
                      },
                  } satisfies FormFieldConfig,
              ]
            : []),
        {
            name: "isActive",
            type: "checkbox",
            label: hasActiveKey
                ? `Use these keys now, instead of the active ones`
                : `Use these keys now (${config.label} has no active keys)`,
            disabled: !hasActiveKey,
        },
    ];

    const handleSubmit = async (values: ApiKeyValues) => {
        setIsLoading(true);
        try {
            // Flutterwave's keys all end "-X", so the characters before it tell them apart
            const secret = values.secretKey.trim().replace(/-X$/, "");
            onSubmit({
                provider,
                name: values.name.trim(),
                mode: values.mode,
                publicKey: config.hasPublicKey ? values.publicKey.trim() : null,
                secretKeyLast4: secret.slice(-4),
                hasEncryptionKey: config.hasEncryptionKey,
                hasWebhookSecret: config.hasWebhookSecret,
                isActive: !hasActiveKey || values.isActive,
            });
        } catch {
            toast.error("Couldn't check the keys. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ApiKeyValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton label="Continue" isLoading={isLoading} disabled={!canSubmit} className="w-auto px-6" />
                </div>
            )}
        />
    );
}
