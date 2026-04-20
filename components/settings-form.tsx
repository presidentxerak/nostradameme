"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";

export interface SettingsFormValues {
  username: string;
  notifyOnResolution: boolean;
  notifyOnNewMarket: boolean;
}

interface SettingsFormProps {
  initial: SettingsFormValues;
  email: string | null;
  oracleTitle: string;
  balance: number;
  onSave: (values: SettingsFormValues) => Promise<void>;
  onAddFunds: () => void;
  onSignOut: () => void;
  onCloseAccount: () => void;
}

export function SettingsForm({
  initial,
  email,
  oracleTitle,
  balance,
  onSave,
  onAddFunds,
  onSignOut,
  onCloseAccount,
}: SettingsFormProps) {
  const [values, setValues] = useState<SettingsFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h3 className="mb-3 font-sans text-xs uppercase tracking-widest text-text-muted">
          {COPY.profile.settings.identity}
        </h3>
        <label className="mb-1 block text-xs text-text-muted">
          {COPY.profile.settings.username}
        </label>
        <Input
          value={values.username}
          placeholder={COPY.profile.settings.usernamePlaceholder}
          onChange={(e) =>
            setValues((v) => ({ ...v, username: e.target.value }))
          }
        />
        <p className="mt-3 text-xs text-text-muted">
          {COPY.profile.settings.oracleTitle}
        </p>
        <p className="font-display text-lg text-accent-glow">{oracleTitle}</p>
      </Card>

      <Card>
        <h3 className="mb-3 font-sans text-xs uppercase tracking-widest text-text-muted">
          {COPY.profile.settings.account}
        </h3>
        <p className="text-xs text-text-muted">{COPY.profile.settings.email}</p>
        <p className="font-mono text-sm text-text-primary">
          {email ?? "\u2014"}
        </p>
        <Button className="mt-4" variant="outline" onClick={onSignOut}>
          {COPY.profile.settings.signOut}
        </Button>
      </Card>

      <Card>
        <h3 className="mb-3 font-sans text-xs uppercase tracking-widest text-text-muted">
          {COPY.profile.settings.balance}
        </h3>
        <p className="text-xs text-text-muted">
          {COPY.profile.settings.currentBalance}
        </p>
        <p className="font-mono text-3xl text-text-primary">
          {formatUsd(balance)}
        </p>
        <Button className="mt-4" onClick={onAddFunds}>
          {COPY.profile.settings.addFunds}
        </Button>
      </Card>

      <Card>
        <h3 className="mb-3 font-sans text-xs uppercase tracking-widest text-text-muted">
          {COPY.profile.settings.notifications}
        </h3>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-primary">
            {COPY.profile.settings.notifyOnResolution}
          </span>
          <Switch
            checked={values.notifyOnResolution}
            onCheckedChange={(v) =>
              setValues((s) => ({ ...s, notifyOnResolution: v }))
            }
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-primary">
            {COPY.profile.settings.notifyOnNewMarket}
          </span>
          <Switch
            checked={values.notifyOnNewMarket}
            onCheckedChange={(v) =>
              setValues((s) => ({ ...s, notifyOnNewMarket: v }))
            }
          />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-text-muted">
            {COPY.profile.settings.pushTitle}
          </p>
          <PushNotificationToggle />
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 font-sans text-xs uppercase tracking-widest text-text-muted">
          {COPY.profile.settings.legal}
        </h3>
        <a
          href="/terms"
          className="block py-1 text-sm text-accent-glow underline"
        >
          {COPY.profile.settings.terms}
        </a>
        <a
          href="/privacy"
          className="block py-1 text-sm text-accent-glow underline"
        >
          {COPY.profile.settings.privacy}
        </a>
        <p className="mt-3 text-xs text-text-muted">
          {COPY.profile.settings.responsible}
        </p>
      </Card>

      <Button size="lg" onClick={handleSave} disabled={saving}>
        {saved
          ? COPY.profile.settings.saved
          : saving
            ? COPY.depositSheet.processing
            : COPY.profile.settings.saveChanges}
      </Button>

      <Card className="border-no/40">
        <h3 className="mb-2 font-sans text-xs uppercase tracking-widest text-no-glow">
          {COPY.profile.settings.dangerZone}
        </h3>
        <Button variant="destructive" onClick={onCloseAccount}>
          {COPY.profile.settings.closeAccount}
        </Button>
      </Card>
    </div>
  );
}
