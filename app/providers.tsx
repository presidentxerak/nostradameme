"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_CONFIG } from "@/lib/privy/config";

interface ProvidersProps {
  children: React.ReactNode;
}

function isValidPrivyAppId(id: string): boolean {
  return Boolean(id) && !id.includes("placeholder") && id.length > 8;
}

export function Providers({ children }: ProvidersProps) {
  if (!isValidPrivyAppId(PRIVY_CONFIG.appId)) {
    // During static generation or when env vars are missing,
    // render children without Privy to avoid initialization crash.
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
      {children}
    </PrivyProvider>
  );
}
