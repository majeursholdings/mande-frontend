import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Live chat — the provider (Intercom, Crisp, Tawk.to…) isn't chosen yet. Once
// it is, load its widget script and open it here; the "Start a chat" button
// only ever calls openSupportChat(), so nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export function openSupportChat(): void {
    toast.info("Live chat is coming soon. Leave us a message below and we'll get back to you.");
}
