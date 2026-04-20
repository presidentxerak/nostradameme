import { OraclePageClient, type OraclePageSlotData } from "./oracle-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SlotKey = "morning" | "noon" | "night";

const EMPTY_SLOTS: OraclePageSlotData[] = [
  { slot: "morning", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
  { slot: "noon", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
  { slot: "night", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
];

async function ensureActiveMarket() {
  try {
    // First resolve any expired markets so they don't block the view.
    const { resolveDueMarkets, lockMarketsApproachingEnd } = await import("@/lib/markets/lifecycle");
    await lockMarketsApproachingEnd();
    await resolveDueMarkets();
  } catch {
    // resolve failed — continue anyway
  }
  try {
    // Then create a new market for the current hour if none exists.
    const { generateHourlyMarket } = await import("@/lib/markets/generator");
    await generateHourlyMarket("auto");
  } catch {
    // Already exists or CoinGecko unavailable.
  }
}

async function loadData() {
  let user: { id: string; email: string | null } | null = null;
  let slotData: OraclePageSlotData[] = EMPTY_SLOTS;
  let balance = 0;
  let username = "anon_oracle";

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

    try {
      user = await getSessionUser();
    } catch {
      // auth unavailable
    }

    // Ensure there's always an active market.
    await ensureActiveMarket();

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
      // DB unreachable
    }

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
      // profile unavailable
    }
  } catch {
    // Supabase modules failed to load
  }

  return { user, slotData, balance, username };
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
