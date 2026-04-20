import type { Metadata } from "next";
import { OraclePageClient, type OraclePageSlotData } from "@/app/oracle-page-client";
import { COPY } from "@/lib/config/copy";

export const dynamic = "force-dynamic";

type SlotKey = "morning" | "noon" | "night";

interface PageProps {
  params: Promise<{ marketId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { marketId } = await params;
    const { getMarketById } = await import("@/lib/services/markets");
    const { buildOgImageUrl, buildShareUrl } = await import("@/lib/utils/share");
    const market = await getMarketById(marketId);
    const title = market
      ? `${market.question} — ${COPY.app.name}`
      : COPY.app.name;
    const description = market?.oracle_quote ?? COPY.app.tagline;
    const ogUrl = buildOgImageUrl({ marketId });
    const shareUrl = buildShareUrl(marketId);
    return {
      title,
      description,
      openGraph: { title, description, url: shareUrl, images: [{ url: ogUrl, width: 640, height: 480 }] },
      twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
    };
  } catch {
    return { title: COPY.app.name, description: COPY.app.tagline };
  }
}

const EMPTY_SLOTS: OraclePageSlotData[] = [
  { slot: "morning", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
  { slot: "noon", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
  { slot: "night", market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null },
];

export default async function PublicMarketPage({
  params,
  searchParams,
}: PageProps) {
  const { marketId } = await params;
  const search = await searchParams;
  const refParam = search.ref;
  const ref = Array.isArray(refParam) ? refParam[0] : refParam;

  let user: { id: string; email: string | null } | null = null;
  let slotData: OraclePageSlotData[] = EMPTY_SLOTS;
  let balance = 0;
  let username = "anon_oracle";

  try {
    const { getSessionUser } = await import("@/lib/auth/session");
    const { getMarketById, getMarketFeed, getMarketPools, getOpenMarketsBySlot, getUserPositionForMarket } = await import("@/lib/services/markets");
    const { getUserBalance } = await import("@/lib/services/positions");
    const { getAdminSupabase } = await import("@/lib/supabase/admin");
    const { resolveUsername } = await import("@/lib/utils/meme-names");

    try { user = await getSessionUser(); } catch { /* */ }

    const [market, slotsMap] = await Promise.all([
      getMarketById(marketId),
      getOpenMarketsBySlot(),
    ]);

    const slotKeys: SlotKey[] = ["morning", "noon", "night"];
    slotData = await Promise.all(
      slotKeys.map(async (slot) => {
        const useMarket = (market && market.slot === slot) ? market : slotsMap[slot];
        if (!useMarket) {
          return { slot, market: null, pools: null, feed: [], userHasPosition: false, userPositionSide: null, userPositionAmount: null };
        }
        const [pools, feed, pos] = await Promise.all([
          getMarketPools(useMarket.id),
          getMarketFeed(useMarket.id),
          user ? getUserPositionForMarket(user.id, useMarket.id) : Promise.resolve(null),
        ]);
        return {
          slot, market: useMarket, pools, feed,
          userHasPosition: !!pos,
          userPositionSide: pos?.side ?? null,
          userPositionAmount: pos ? Number(pos.amount) : null,
        };
      }),
    );

    if (user) {
      balance = await getUserBalance(user.id);
      const admin = getAdminSupabase();
      const { data } = await admin.from("profiles").select("username").eq("id", user.id).maybeSingle();
      username = resolveUsername(user.id, (data as { username: string | null } | null)?.username ?? null);
    }
  } catch {
    // DB unavailable
  }

  return (
    <OraclePageClient
      slots={slotData}
      userId={user?.id ?? null}
      username={username}
      initialBalance={balance}
      isAuthed={Boolean(user)}
      refUsername={ref ?? null}
    />
  );
}
