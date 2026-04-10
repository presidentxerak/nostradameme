import { getSessionUser } from "@/lib/auth/session";
import {
  getMarketFeed,
  getMarketPools,
  getOpenMarketsBySlot,
  getUserPositionForMarket,
} from "@/lib/services/markets";
import { getUserBalance } from "@/lib/services/positions";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveUsername } from "@/lib/utils/meme-names";
import { OraclePageClient, type OraclePageSlotData } from "./oracle-page-client";
import type { ProfileRow } from "@/types/db";
import type { SlotKey } from "@/components/slot-tabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OraclePage() {
  const user = await getSessionUser();
  const slots = await getOpenMarketsBySlot();

  const slotKeys: SlotKey[] = ["morning", "noon", "night"];
  const slotData: OraclePageSlotData[] = await Promise.all(
    slotKeys.map(async (slot) => {
      const market = slots[slot];
      if (!market) {
        return {
          slot,
          market: null,
          pools: null,
          feed: [],
          userHasPosition: false,
          userPositionSide: null,
          userPositionAmount: null,
        };
      }
      const [pools, feed, pos] = await Promise.all([
        getMarketPools(market.id),
        getMarketFeed(market.id),
        user ? getUserPositionForMarket(user.id, market.id) : Promise.resolve(null),
      ]);
      return {
        slot,
        market,
        pools,
        feed,
        userHasPosition: !!pos,
        userPositionSide: pos?.side ?? null,
        userPositionAmount: pos ? Number(pos.amount) : null,
      };
    }),
  );

  let balance = 0;
  let username = "anon_oracle";
  if (user) {
    balance = await getUserBalance(user.id);
    const admin = getAdminSupabase();
    const { data } = await admin
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    const profile = data as Pick<ProfileRow, "username"> | null;
    username = resolveUsername(user.id, profile?.username ?? null);
  }

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
