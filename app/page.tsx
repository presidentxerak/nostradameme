import { COPY } from "@/lib/config/copy";

export const dynamic = "force-dynamic";

export default function OraclePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="font-display text-5xl tracking-widest text-accent-glow">
        {COPY.header.logo}
      </h1>
      <p className="text-xl text-text-secondary">{COPY.app.tagline}</p>
      <div className="text-6xl">{"\u{1f52e}"}</div>
      <p className="text-sm text-text-muted">{COPY.oracle.silent}</p>
    </div>
  );
}
