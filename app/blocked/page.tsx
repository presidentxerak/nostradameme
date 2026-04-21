import { COPY } from "@/lib/config/copy";

export const dynamic = "force-dynamic";

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="font-display text-5xl text-accent-glow text-glow-accent">{"\u2717"}</div>
      <h1 className="font-display text-3xl text-accent-glow">
        {COPY.blocked.title}
      </h1>
      <p className="max-w-md text-text-secondary">{COPY.blocked.body}</p>
    </div>
  );
}
