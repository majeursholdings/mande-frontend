"use client";

import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import { LoadError } from "@/components/adminPlatform/emptyState";
import ShopSettingsForm, { ShopSettingsFormSkeleton } from "../form/shopSettingsForm";
import { useSuperAdminSettings } from "../settingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// ShopTab: the rules MANDE Shop runs on. Which plans can sell, and how many
// products, are set on each plan under Plans; one manufacturer's access is
// on the Shop page's Sellers tab.
// ─────────────────────────────────────────────────────────────────────────────

export default function ShopTab() {
    const { platformSettings, updateShopSettings, sectionStatus } = useSuperAdminSettings();
    const { isLoading } = sectionStatus.platformSettings;

    if (!platformSettings?.shop && !isLoading) {
        return <LoadError message="We couldn't load the shop settings. Please refresh the page." />;
    }

    return (
        <SettingsSection
            headingLevel="h3"
            title="Shop rules"
            description="How MANDE Shop runs: whether manufacturers can sell, MANDE's charge on each sale, and the time limits orders and reviews follow. Which plans can sell is set on each plan."
        >
            {platformSettings?.shop ? <ShopSettingsForm settings={platformSettings.shop} onSave={updateShopSettings} /> : <ShopSettingsFormSkeleton />}
        </SettingsSection>
    );
}
