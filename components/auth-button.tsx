"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";

export function AuthButton() {
  let login: (() => void) | null = null;
  let logout: (() => void) | null = null;
  let authenticated = false;
  let ready = false;
  let displayName: string | null = null;

  try {
    const privy = usePrivy();
    login = privy.login;
    logout = privy.logout;
    authenticated = privy.authenticated;
    ready = privy.ready;
    if (privy.user?.email?.address) {
      displayName = privy.user.email.address.split("@")[0] ?? null;
    }
  } catch {
    // Privy not available (not configured).
  }

  if (!ready) {
    return (
      <Button size="sm" variant="outline" className="h-8 px-3 text-xs" disabled>
        ...
      </Button>
    );
  }

  if (authenticated) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs"
        onClick={() => logout?.()}
      >
        {displayName ?? COPY.auth.signOut}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="default"
      className="h-8 px-3 text-xs"
      onClick={() => login?.()}
    >
      {COPY.auth.signIn}
    </Button>
  );
}
