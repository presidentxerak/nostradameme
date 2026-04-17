"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Register lazily to avoid blocking first paint.
    const handle = window.setTimeout(() => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Service worker registration is best-effort; swallow errors.
        });
    }, 1500);
    return () => window.clearTimeout(handle);
  }, []);
  return null;
}
