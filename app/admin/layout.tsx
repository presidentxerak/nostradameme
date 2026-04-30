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
  // /api/auth/sync. If missing or non-admin, redirect away before any
  // admin data renders. Client-side AdminGate provides UX feedback while
  // the cookie is being set on first render after sign-in.
  const user = await getServerPrivyUser();
  if (!user || user.role !== "admin") {
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
