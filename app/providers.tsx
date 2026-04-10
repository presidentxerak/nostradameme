"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_CONFIG } from "@/lib/privy/config";
import { useEffect } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // After login, sync the profile row.
    // No-op on first render; ensureProfile is called lazily.
  }, []);
  return (
    <PrivyProvider
      appId={PRIVY_CONFIG.appId}
      config={{
        loginMethods: [...PRIVY_CONFIG.loginMethods],
        appearance: PRIVY_CONFIG.appearance,
        embeddedWallets: PRIVY_CONFIG.embeddedWallets,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
