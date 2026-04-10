import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import {
  getMarketById,
  getMarketFeed,
  getMarketPools,
  getUserPositionForMarket,
  getOpenMarketsBySlot,
} from "@/lib/services/markets";
import { getUserBalance } from "@/lib/services/positions";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveUsername } from "@/lib/utils/meme-names";
import { OraclePageClient, type OraclePageSlotData } from "@/app/oracle-page-client";
import { buildOgImageUrl, buildShareUrl } from "@/lib/utils/share";
import type { ProfileRow } from "@/types/db";
import type { SlotKey } from "@/components/slot-tabs";
import { COPY } from "@/lib/config/copy";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ marketId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { marketId } = await params;
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
    openGraph: {
      title,
      description,
      url: shareUrl,
      images: [{ url: ogUrl, width: 640, height: 480 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function PublicMarketPage({
  params,
  searchParams,
}: PageProps) {
  const { marketId } = await params;
  const search = await searchParams;
  const refParam = search.ref;
  const ref = Array.isArray(refParam) ? refParam[0] : refParam;
  const user = await getSessionUser();
  const [market, slotsMap] = await Promise.all([
    getMarketById(marketId),
    getOpenMarketsBySlot(),
  ]);

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
    username = resolveUsername(
      user.id,
      (data as Pick<ProfileRow, "username"> | null)?.username ?? null,
    );
  }

  // Build slots: the targeted market replaces its slot if present,
  // otherwise inject it under its own slot.
  const slotKeys: SlotKey[] = ["morning", "noon", "night"];
  const slotData: OraclePageSlotData[] = await Promise.all(
    slotKeys.map(async (slot) => {
      const useMarket =
        market && market.slot === slot
          ? market
          : slotsMap[slot];
      if (!useMarket) {
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
        getMarketPools(useMarket.id),
        getMarketFeed(useMarket.id),
        user
          ? getUserPositionForMarket(user.id, useMarket.id)
          : Promise.resolve(null),
      ]);
      return {
        slot,
        market: useMarket,
        pools,
        feed,
        userHasPosition: !!pos,
        userPositionSide: pos?.side ?? null,
        userPositionAmount: pos ? Number(pos.amount) : null,
      };
    }),
  );

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
