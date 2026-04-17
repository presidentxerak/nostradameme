"use client";

import { useCallback, useEffect, useState } from "react";

export type PushState =
  | "unsupported"
  | "default"
  | "denied"
  | "granted-subscribed"
  | "granted-unsubscribed"
  | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

export function usePushSubscription(): {
  state: PushState;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  error: string | null;
} {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    const permission = Notification.permission;
    if (permission === "denied") {
      setState("denied");
      return;
    }
    if (permission === "default") {
      setState("default");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setState("granted-unsubscribed");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "granted-subscribed" : "granted-unsubscribed");
    } catch {
      setState("granted-unsubscribed");
    }
  }, []);

  useEffect(() => {
    void detect();
  }, [detect]);

  const enable = useCallback(async () => {
    setError(null);
    try {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const keyResp = await fetch("/api/push/vapid-key");
      const keyData = (await keyResp.json()) as { publicKey: string | null };
      if (!keyData.publicKey) {
        setError("Push not configured on server");
        setState("granted-unsubscribed");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey).buffer as ArrayBuffer,
      });

      const json = sub.toJSON();
      const resp = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
          userAgent: navigator.userAgent,
        }),
      });
      if (!resp.ok) {
        setError("Could not save subscription");
        return;
      }
      setState("granted-subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    try {
      if (typeof window === "undefined") return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setState("granted-unsubscribed");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("granted-unsubscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  return { state, enable, disable, error };
}
