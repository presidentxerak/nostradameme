import { Card } from "@/components/ui/card";
import { getAppSettings } from "@/lib/config/app-settings";
import { getFeatureFlags } from "@/lib/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();
  const flags = getFeatureFlags();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl uppercase tracking-widest text-accent-glow">
        Settings
      </h2>
      <Card>
        <h3 className="mb-2 text-sm uppercase tracking-widest text-text-muted">
          Runtime
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-text-muted">App mode</span>
          <span className="font-mono">{settings.app_mode}</span>
          <span className="text-text-muted">Real money</span>
          <span className="font-mono">
            {settings.real_money_enabled ? "true" : "false"}
          </span>
          <span className="text-text-muted">Platform fee</span>
          <span className="font-mono">{settings.platform_fee_bps} bps</span>
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm uppercase tracking-widest text-text-muted">
          Feature flags
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-text-muted">Payouts</span>
          <span className="font-mono">
            {flags.payoutsEnabled ? "true" : "false"}
          </span>
          <span className="text-text-muted">On-ramp</span>
          <span className="font-mono">
            {flags.onrampEnabled ? "true" : "false"}
          </span>
        </div>
      </Card>
    </div>
  );
}
