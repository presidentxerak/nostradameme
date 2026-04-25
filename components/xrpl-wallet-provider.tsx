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
  adapters: Array<{ name: string; icon?: string }>;
  connected: boolean;
  account: { address: string } | null;
  wallet: { name: string } | null;
  connect: (adapterName: string) => Promise<unknown>;
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

const XAMAN_API_KEY = process.env.NEXT_PUBLIC_XAMAN_API_KEY ?? "";

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

        const { WalletManager, CrossmarkAdapter, GemWalletAdapter, XamanAdapter } = mod;

        const adapters: unknown[] = [
          new CrossmarkAdapter(),
          new GemWalletAdapter(),
        ];
        if (XAMAN_API_KEY) {
          adapters.unshift(new XamanAdapter({ apiKey: XAMAN_API_KEY }));
        }

        const manager = new WalletManager({
          adapters,
          network: "mainnet",
          autoConnect: true,
        }) as unknown as XrplWalletManager;

        managerRef.current = manager;

        manager.on("connect", (account: unknown) => {
          const acc = account as { address: string };
          setConnected(true);
          setAddress(acc.address);
          setWalletName(manager.wallet?.name ?? null);
        });

        manager.on("disconnect", () => {
          setConnected(false);
          setAddress(null);
          setWalletName(null);
        });

        manager.on("accountChange", (account: unknown) => {
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
