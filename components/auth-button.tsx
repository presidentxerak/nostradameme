"use client";

import { usePrivy } from "@privy-io/react-auth";
import { usePrivyAvailable } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";

function PrivyAuthButton() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const displayName = user?.email?.address
    ? user.email.address.split("@")[0]
    : null;

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
        onClick={() => void logout()}
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
      onClick={() => void login()}
    >
      {COPY.auth.signIn}
    </Button>
  );
}

function FallbackAuthButton() {
  return (
    <Button size="sm" variant="outline" className="h-8 px-3 text-xs opacity-50" disabled>
      {COPY.auth.signIn}
    </Button>
  );
}

export function AuthButton() {
  const available = usePrivyAvailable();
  if (!available) return <FallbackAuthButton />;
  return <PrivyAuthButton />;
}
