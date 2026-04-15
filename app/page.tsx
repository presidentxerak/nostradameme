import { COPY } from "@/lib/config/copy";
import { OraclePageClient, type OraclePageSlotData } from "./oracle-page-client";
import type { SlotKey } from "@/components/slot-tabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMPTY_SLOTS: OraclePageSlotData[] = [
  { slot: "morning", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
  { slot: "noon", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
  { slot: "night", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
];

async function loadData() {
  try {
    const { getSessionUser } = await import("@/lib/auth/session");
    const {
      getMarketFeed,
      getMarketPools,
      getOpenMarketsBySlot,
      getUserPositionForMarket,
    } = await import("@/lib/services/markets");
    const { getUserBalance } = await import("@/lib/services/positions");
    const { getAdminSupabase } = await import("@/lib/supabase/admin");
    const { resolveUsername } = await import("@/lib/utils/meme-names");

    let user: { id: string; email: string | null } | null = null;
    try {
      user = await getSessionUser();
    } catch {
      // Not authenticated or Supabase unavailable.
    }

    let slotData: OraclePageSlotData[] = EMPTY_SLOTS;
    try {
      const slots = await getOpenMarketsBySlot();
      const slotKeys: SlotKey[] = ["morning", "noon", "night"];
      slotData = await Promise.all(
        slotKeys.map(async (slot) => {
          const market = slots[slot];
          if (!market) {
            return { slot, market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null };
          }
          const [pools, feed, pos] = await Promise.all([
            getMarketPools(market.id),
            getMarketFeed(market.id),
            user ? getUserPositionForMarket(user.id, market.id) : Promise.resolve(null),
          ]);
          return {
            slot, market, pools, feed,
            userHasPosition: !!pos,
            userPositionSide: pos?.side ?? null,
            userPositionAmount: pos ? Number(pos.amount) : null,
          };
        }),
      );
    } catch {
      // DB unreachable — empty markets.
    }

    let balance = 0;
    let username = "anon_oracle";
    try {
      if (user) {
        balance = await getUserBalance(user.id);
        const admin = getAdminSupabase();
        const { data } = await admin
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        const profile = data as { username: string | null } | null;
        username = resolveUsername(user.id, profile?.username ?? null);
      }
    } catch {
      // Profile fetch failed.
    }

    return { user, slotData, balance, username };
  } catch {
    // Module import failed — Supabase not configured at all.
    return { user: null, slotData: EMPTY_SLOTS, balance: 0, username: "anon_oracle" };
  }
}

export default async function OraclePage() {
  const { user, slotData, balance, username } = await loadData();

  return (
    <OraclePageClient
      slots={slotData}
      userId={user?.id ?? null}
      username={username}
      initialBalance={balance}
      isAuthed={Boolean(user)}
      refUsername={null}
    />
  );
}
