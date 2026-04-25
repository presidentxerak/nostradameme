declare module "xrpl-connect" {
  export class WalletManager {
    constructor(options: {
      adapters: unknown[];
      network: string;
      autoConnect?: boolean;
    });
    adapters: Array<{ name: string; icon?: string }>;
    connected: boolean;
    account: { address: string; network: { id: string; name: string } } | null;
    wallet: { name: string } | null;
    connect(adapterName: string): Promise<{ address: string }>;
    disconnect(): Promise<void>;
    sign(tx: Record<string, unknown>): Promise<{ hash: string; tx_blob?: string }>;
    signAndSubmit(tx: Record<string, unknown>): Promise<{ hash: string }>;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
  }

  export class XamanAdapter {
    constructor(options: { apiKey: string });
    name: string;
    icon?: string;
  }

  export class CrossmarkAdapter {
    constructor();
    name: string;
    icon?: string;
  }

  export class GemWalletAdapter {
    constructor();
    name: string;
    icon?: string;
  }

  export class WalletConnectAdapter {
    constructor(options: { projectId: string });
    name: string;
    icon?: string;
  }

  export class LedgerAdapter {
    constructor(options?: { accountIndex?: number });
    name: string;
    icon?: string;
  }
}
