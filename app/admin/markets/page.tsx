import { MarketTable } from "@/components/admin/market-table";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { MarketRow } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminMarketsPage() {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("markets")
    .select("*")
    .order("start_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as MarketRow[];
  // Look up pool volumes from the market_pools view in parallel.
  const volumes = await Promise.all(
    rows.map(async (m) => {
      const { data: pool } = await admin
        .from("market_pools")
        .select("total_volume")
        .eq("market_id", m.id)
        .maybeSingle();
      return Number(
        (pool as { total_volume?: number | string } | null)?.total_volume ?? 0,
      );
    }),
  );
  const markets = rows.map((m, i) => ({
    ...m,
    total_volume: volumes[i] ?? 0,
  }));
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl uppercase tracking-widest text-accent-glow">
        Markets
      </h2>
      <MarketTable markets={markets} />
    </div>
  );
}
