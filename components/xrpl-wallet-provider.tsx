"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface XrplWalletManager {
  adapters: Array<{ id: string; name: string; icon?: string }>;
  connected: boolean;
  account: { address: string } | null;
  wallet: { name: string } | null;
  connect: (adapterId: string) => Promise<unknown>;
  disconnect: () => Promise<void>;
  signAndSubmit: (tx: Record<string, unknown>) => Promise<{ hash: string }>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface XrplWalletState {
  manager: XrplWalletManager | null;
  connected: boolean;
  address: string | null;
  walletName: string | null;
  disconnect: () => Promise<void>;
}

const XrplWalletContext = createContext<XrplWalletState>({
  manager: null,
  connected: false,
  address: null,
  walletName: null,
  disconnect: async () => undefined,
});

export function useXrplWallet() {
  return useContext(XrplWalletContext);
}

// Public env var, inlined by Next.js at build time. We read it lazily inside
// the effect to avoid relying on the validated env module on the client.
const XAMAN_API_KEY = process.env.NEXT_PUBLIC_XAMAN_API_KEY ?? "";
// (This var is also declared in lib/config/env.ts so server-side code can
// validate its presence; the client read happens here at build time.)

export function XrplWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const managerRef = useRef<XrplWalletManager | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const mod = await import("xrpl-connect");
        if (cancelled) return;

        const { WalletManager, GemWalletAdapter, XamanAdapter } = mod;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const adapters: unknown[] = [];
        if (XAMAN_API_KEY) {
          adapters.push(new XamanAdapter({ apiKey: XAMAN_API_KEY }));
        }
        if (!isMobile) {
          adapters.push(new GemWalletAdapter());
        }

        const manager = new WalletManager({
          adapters,
          network: "mainnet",
          autoConnect: true,
        });

        const rawAdapters = (manager as unknown as Record<string, unknown>).adapters;
        const adapterList: Array<{ id: string; name: string; icon?: string }> = Array.isArray(rawAdapters)
          ? rawAdapters.map((a: Record<string, unknown>) => ({
              id: String(a.id ?? a.name ?? ""),
              name: String(a.name ?? a.id ?? ""),
              icon: a.icon ? String(a.icon) : undefined,
            }))
          : adapters.map((a) => ({
              id: String((a as { id?: string }).id ?? (a as { name: string }).name),
              name: (a as { name: string }).name,
              icon: (a as { icon?: string }).icon,
            }));

        const wrapped: XrplWalletManager = {
          get adapters() { return adapterList; },
          get connected() { return (manager as unknown as { connected: boolean }).connected; },
          get account() { return (manager as unknown as { account: { address: string } | null }).account; },
          get wallet() { return (manager as unknown as { wallet: { name: string } | null }).wallet; },
          connect: (name: string) => (manager as unknown as { connect: (n: string) => Promise<{ address: string }> }).connect(name),
          disconnect: () => (manager as unknown as { disconnect: () => Promise<void> }).disconnect(),
          signAndSubmit: (tx: Record<string, unknown>) => (manager as unknown as { signAndSubmit: (t: Record<string, unknown>) => Promise<{ hash: string }> }).signAndSubmit(tx),
          on: (event: string, handler: (...args: unknown[]) => void) => (manager as unknown as { on: (e: string, h: (...a: unknown[]) => void) => void }).on(event, handler),
        };

        managerRef.current = wrapped;

        wrapped.on("connect", (account: unknown) => {
          const acc = account as { address: string };
          setConnected(true);
          setAddress(acc.address);
          setWalletName(wrapped.wallet?.name ?? null);
        });

        wrapped.on("disconnect", () => {
          setConnected(false);
          setAddress(null);
          setWalletName(null);
        });

        wrapped.on("accountChange", (account: unknown) => {
          const acc = account as { address: string };
          setAddress(acc.address);
        });

        setReady(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[xrpl-connect] init failed:", err);
      }
    }

    void init();

    return () => {
      cancelled = true;
      managerRef.current?.disconnect().catch(() => undefined);
    };
  }, []);

  const disconnect = async () => {
    await managerRef.current?.disconnect().catch(() => undefined);
  };

  return (
    <XrplWalletContext.Provider
      value={{
        manager: managerRef.current,
        connected,
        address,
        walletName,
        disconnect,
      }}
    >
      {children}
    </XrplWalletContext.Provider>
  );
}
