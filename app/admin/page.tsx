import Link from "next/link";
import { Card } from "@/components/ui/card";
import { COPY } from "@/lib/config/copy";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const admin = getAdminSupabase();
  const [{ count: marketsOpen }, { count: marketsResolved }] = await Promise.all([
    admin
      .from("markets")
      .select("id", { head: true, count: "exact" })
      .eq("status", "open"),
    admin
      .from("markets")
      .select("id", { head: true, count: "exact" })
      .eq("status", "resolved"),
  ]);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Link href="/admin/markets">
        <Card>
          <h3 className="font-display text-sm uppercase tracking-widest text-text-muted">
            {COPY.admin.markets}
          </h3>
          <p className="mt-2 font-mono text-3xl text-accent-glow">
            {marketsOpen ?? 0} open
          </p>
          <p className="font-mono text-xs text-text-muted">
            {marketsResolved ?? 0} resolved
          </p>
        </Card>
      </Link>
      <Link href="/admin/treasury">
        <Card>
          <h3 className="font-display text-sm uppercase tracking-widest text-text-muted">
            {COPY.admin.treasury}
          </h3>
          <p className="mt-2 font-mono text-xl text-gold-glow">View</p>
        </Card>
      </Link>
      <Link href="/admin/settings">
        <Card>
          <h3 className="font-display text-sm uppercase tracking-widest text-text-muted">
            {COPY.admin.settings}
          </h3>
          <p className="mt-2 font-mono text-xl text-text-primary">Configure</p>
        </Card>
      </Link>
    </div>
  );
}
