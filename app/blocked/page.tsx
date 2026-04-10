import { COPY } from "@/lib/config/copy";

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="text-6xl">{"\u{1f6ab}"}</div>
      <h1 className="font-display text-3xl text-accent-glow">
        {COPY.blocked.title}
      </h1>
      <p className="max-w-md text-text-secondary">{COPY.blocked.body}</p>
    </div>
  );
}
