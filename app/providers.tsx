"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { PRIVY_CONFIG } from "@/lib/privy/config";

interface ProvidersProps {
  children: React.ReactNode;
}

const PrivyAvailableContext = createContext(false);

export function usePrivyAvailable(): boolean {
  return useContext(PrivyAvailableContext);
}

function isValidPrivyAppId(id: string): boolean {
  return Boolean(id) && !id.includes("placeholder") && id.length > 8;
}

function AuthSync({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, getAccessToken } = usePrivy();

  const syncProfile = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
    } catch {
      // will retry next load
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (ready && authenticated) {
      void syncProfile();
    }
  }, [ready, authenticated, syncProfile]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  if (!isValidPrivyAppId(PRIVY_CONFIG.appId)) {
    return (
      <PrivyAvailableContext.Provider value={false}>
        {children}
      </PrivyAvailableContext.Provider>
    );
  }
  return (
    <PrivyAvailableContext.Provider value={true}>
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
    </PrivyAvailableContext.Provider>
  );
}
