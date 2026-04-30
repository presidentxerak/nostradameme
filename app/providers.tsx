"use client";

import { createContext, useContext, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { PRIVY_CONFIG } from "@/lib/privy/config";

interface ProvidersProps {
  children: React.ReactNode;
}

const PrivyAvailableContext = createContext(false);
const GetTokenContext = createContext<() => Promise<string | null>>(async () => null);

export function usePrivyAvailable(): boolean {
  return useContext(PrivyAvailableContext);
}

export function useGetToken(): () => Promise<string | null> {
  return useContext(GetTokenContext);
}

function isValidPrivyAppId(id: string): boolean {
  return Boolean(id) && !id.includes("placeholder") && id.length > 8;
}

function AuthSync({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const syncedRef = useRef(false);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  }, [getAccessToken]);

  const syncProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      // After the cookie is posted, redirect to the originally-requested page
      // if `?next=` is on the URL (used by admin SSR redirect when there was
      // no cookie yet), otherwise refresh so SSR picks up the new session.
      // We read the URL via window.location instead of useSearchParams() so
      // this component doesn't force a Suspense boundary on every layout
      // (which would break static prerendering of /contact, /privacy, etc.).
      let next: string | null = null;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        next = params.get("next");
      }
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      } else {
        router.refresh();
      }
    } catch {
      // will retry next load
    }
  }, [getToken, router]);

  useEffect(() => {
    if (!ready || !authenticated) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;
    void syncProfile();
  }, [ready, authenticated, syncProfile]);

  return (
    <GetTokenContext.Provider value={getToken}>
      {children}
    </GetTokenContext.Provider>
  );
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
