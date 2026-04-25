"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  WalletManager,
  XamanAdapter,
  CrossmarkAdapter,
  GemWalletAdapter,
} from "xrpl-connect";

interface XrplWalletState {
  manager: WalletManager | null;
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
  const managerRef = useRef<WalletManager | null>(null);

  useEffect(() => {
    const adapters = [
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
    });
    managerRef.current = manager;

    manager.on("connect", (account: { address: string }) => {
      setConnected(true);
      setAddress(account.address);
      setWalletName(manager.wallet?.name ?? null);
    });

    manager.on("disconnect", () => {
      setConnected(false);
      setAddress(null);
      setWalletName(null);
    });

    manager.on("accountChange", (account: { address: string }) => {
      setAddress(account.address);
    });

    return () => {
      manager.disconnect().catch(() => undefined);
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
