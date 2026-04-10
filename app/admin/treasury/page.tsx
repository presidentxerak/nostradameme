import { TreasuryCard } from "@/components/admin/treasury-card";
import {
  getNetworkStatus,
  getTreasuryRlusdBalance,
} from "@/lib/treasury/xrpl";

export const dynamic = "force-dynamic";

export default async function AdminTreasuryPage() {
  let balance = 0;
  let status;
  try {
    balance = await getTreasuryRlusdBalance();
  } catch {
    balance = 0;
  }
  try {
    status = await getNetworkStatus();
  } catch {
    status = {
      connected: false,
      ledgerIndex: 0,
      treasuryAddress: "unavailable",
      reserveBaseXrp: null,
    };
  }
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl uppercase tracking-widest text-accent-glow">
        Treasury
      </h2>
      <TreasuryCard
        balance={balance}
        address={status.treasuryAddress}
        connected={status.connected}
        ledgerIndex={status.ledgerIndex}
      />
    </div>
  );
}
