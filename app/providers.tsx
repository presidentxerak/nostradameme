"use client";

import { useEffect, useCallback } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { PRIVY_CONFIG } from "@/lib/privy/config";

interface ProvidersProps {
  children: React.ReactNode;
}

function isValidPrivyAppId(id: string): boolean {
  return Boolean(id) && !id.includes("placeholder") && id.length > 8;
}

function AuthSync({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = usePrivy();

  const syncProfile = useCallback(async () => {
    try {
      await fetch("/api/auth/sync", { method: "POST" });
    } catch {
      // sync failed — will retry next load
    }
  }, []);

  useEffect(() => {
    if (ready && authenticated) {
      void syncProfile();
    }
  }, [ready, authenticated, syncProfile]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  if (!isValidPrivyAppId(PRIVY_CONFIG.appId)) {
    return <>{children}</>;
  }
  return (
    <PrivyProvider
      appId={PRIVY_CONFIG.appId}
      config={{
        loginMethods: [...PRIVY_CONFIG.loginMethods],
        appearance: PRIVY_CONFIG.appearance,
        embeddedWallets: PRIVY_CONFIG.embeddedWallets,
      }}
    >
      <AuthSync>{children}</AuthSync>
    </PrivyProvider>
  );
}
