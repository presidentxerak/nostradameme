import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerPrivyUser } from "@/lib/auth/privy-cookie";
import { COPY } from "@/lib/config/copy";
import { AdminGate } from "./admin-gate";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate: requires the Privy access-token cookie set by
  // /api/auth/sync. If missing, redirect to home with `?next=` so AuthSync
  // can bring the user back here once the cookie is posted. If present
  // but non-admin, redirect to home plainly.
  const user = await getServerPrivyUser();
  if (!user) {
    // Redirect to home with `next=/admin` so AuthSync forwards the user back
    // here as soon as the Privy cookie is posted.
    redirect(`/?next=${encodeURIComponent("/admin")}`);
  }
  if (user.role !== "admin") {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-5">
          <Link
            href="/admin"
            className="font-display text-xl tracking-widest text-accent-glow"
          >
            {COPY.admin.title}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/admin/markets"
              className="text-text-secondary hover:text-text-primary"
            >
              {COPY.admin.markets}
            </Link>
            <Link
              href="/admin/treasury"
              className="text-text-secondary hover:text-text-primary"
            >
              {COPY.admin.treasury}
            </Link>
            <Link
              href="/admin/settings"
              className="text-text-secondary hover:text-text-primary"
            >
              {COPY.admin.settings}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <AdminGate>{children}</AdminGate>
      </main>
    </div>
  );
}
