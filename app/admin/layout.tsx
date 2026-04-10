import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { COPY } from "@/lib/config/copy";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (!(await isAdmin(user.id))) redirect("/");
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
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
