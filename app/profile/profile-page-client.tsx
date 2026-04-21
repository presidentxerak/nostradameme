"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePrivyAvailable } from "@/app/providers";
import { OracleIdentityCard } from "@/components/oracle-identity-card";
import { SettingsForm, type SettingsFormValues } from "@/components/settings-form";
import { DepositChooser } from "@/components/deposit-chooser";
import { SolWithdrawSheet } from "@/components/sol-withdraw-sheet";
import { BottomNav } from "@/components/bottom-nav";
import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
interface ProfilePageClientProps {
  userId: string;
  username: string;
  email: string | null;
  oracleTitle: string;
  winRate: number;
  totalPredictions: number;
  totalEarned: number;
  balance: number;
  initialSettings: SettingsFormValues;
  isAuthed: boolean;
}

type Tab = "wallet" | "leaderboard" | "settings";

export function ProfilePageClient(props: ProfilePageClientProps) {
  const privyAvailable = usePrivyAvailable();

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-2xl text-white">
          {COPY.profile.title}
        </h1>
        <AuthButton />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {privyAvailable ? (
            <PrivyProfileContent {...props} />
          ) : (
            <SignInPrompt />
          )}
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center gap-5 pt-12 text-center">
      <div className="h-20 w-20 rounded-full bg-surface border border-border/40 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-text-muted">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 10-16 0" />
        </svg>
      </div>
      <p className="text-lg text-text-secondary">{COPY.auth.signInPrompt}</p>
      <AuthButton />
    </div>
  );
}

function PrivyProfileContent(props: ProfilePageClientProps) {
  const { authenticated, ready, user, logout, getAccessToken } = usePrivy();
  const [tab, setTab] = useState<Tab>("wallet");
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMode, setDepositMode] = useState<"sol" | "xrp" | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (!ready) {
    return <p className="text-center text-text-muted py-12">Loading...</p>;
  }

  if (!authenticated) {
    return <SignInPrompt />;
  }

  const displayName = user?.email?.address?.split("@")[0] ?? props.username;

  const handleSignOut = async () => {
    await logout();
    window.location.href = "/";
  };

  const handleSaveSettings = async (values: SettingsFormValues) => {
    const token = await getAccessToken();
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });
  };

  const handleCloseAccount = async () => {
    if (!window.confirm("Are you sure?")) return;
    const token = await getAccessToken();
    await fetch("/api/me/close-account", { method: "POST", headers: { authorization: `Bearer ${token}` } });
    await logout();
    window.location.href = "/";
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "wallet", label: "Wallet" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <>
      <OracleIdentityCard
        userId={props.userId || "user"}
        username={displayName}
        oracleTitle={props.oracleTitle}
        winRate={props.winRate}
        totalPredictions={props.totalPredictions}
        totalEarned={props.totalEarned}
      />

      <div className="flex gap-1 rounded-xl border border-border/40 bg-surface/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold tracking-wider transition-all ${
              tab === t.key
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "wallet" && (
        <WalletTab
          balance={props.balance}
          onDeposit={() => setDepositOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
        />
      )}

      {tab === "settings" && (
        <SettingsForm
          initial={props.initialSettings}
          email={user?.email?.address ?? props.email}
          oracleTitle={props.oracleTitle}
          balance={props.balance}
          onSave={handleSaveSettings}
          onAddFunds={() => setDepositOpen(true)}
          onSignOut={handleSignOut}
          onCloseAccount={handleCloseAccount}
        />
      )}

      <DepositChooser open={depositOpen} onOpenChange={setDepositOpen} mode={depositMode} onModeChange={setDepositMode} />
      <SolWithdrawSheet open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={props.balance} />
    </>
  );
}

function WalletTab({
  balance,
  onDeposit,
  onWithdraw,
}: {
  balance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center gap-4 py-6">
        <p className="text-xs uppercase tracking-widest text-text-muted">
          {COPY.profile.identity.balance}
        </p>
        <p className="text-5xl font-bold text-text-primary">
          {formatUsd(balance)}
        </p>
      </Card>
      <SolanaWalletCard onDeposit={onDeposit} onWithdraw={onWithdraw} />
    </div>
  );
}

function SolanaWalletCard({
  onDeposit,
  onWithdraw,
}: {
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const wallet = useWallet();
  const modal = useWalletModal();

  if (wallet.connected) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yes" />
          <span className="text-sm text-text-primary">Wallet connected</span>
        </div>
        <p className="text-xs text-text-muted break-all">{wallet.publicKey?.toBase58()}</p>
        <div className="flex gap-3">
          <Button onClick={onDeposit} className="flex-1" size="lg">
            Deposit SOL
          </Button>
          <Button onClick={onWithdraw} variant="outline" className="flex-1" size="lg">
            Withdraw
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-4 py-6">
      <p className="text-sm text-text-secondary text-center">
        Connect your Solana wallet to deposit and withdraw
      </p>
      <Button onClick={() => modal.setVisible(true)} size="lg">
        Connect wallet
      </Button>
    </Card>
  );
}
