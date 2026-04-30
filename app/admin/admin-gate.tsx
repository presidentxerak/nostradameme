"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetToken } from "@/app/providers";

type State = "checking" | "ok" | "denied";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("checking");
  const getToken = useGetToken();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) setState("denied");
          return;
        }
        const res = await fetch("/api/admin/me", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!cancelled) setState(res.ok ? "ok" : "denied");
      } catch {
        if (!cancelled) setState("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  useEffect(() => {
    if (state === "denied") router.replace("/");
  }, [state, router]);

  if (state === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        Verifying admin access…
      </div>
    );
  }
  if (state === "denied") {
    return null;
  }
  return <>{children}</>;
}
