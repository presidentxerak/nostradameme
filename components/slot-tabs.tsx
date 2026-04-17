"use client";

import { COPY } from "@/lib/config/copy";
import { cn } from "@/lib/utils/cn";

type SlotKey = "morning" | "noon" | "night";

interface SlotTabsProps {
  active: SlotKey;
  onSelect: (slot: SlotKey) => void;
  availability: Record<SlotKey, "open" | "locked" | "upcoming">;
  opensInLabel?: Record<SlotKey, string | null>;
}

export function SlotTabs({
  active,
  onSelect,
  availability,
  opensInLabel,
}: SlotTabsProps) {
  const slots: { key: SlotKey; meta: { label: string; short: string } }[] = [
    { key: "morning", meta: COPY.slots.morning },
    { key: "noon", meta: COPY.slots.noon },
    { key: "night", meta: COPY.slots.night },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map(({ key, meta }) => {
        const state = availability[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg border py-2 text-xs transition-all",
              isActive
                ? "border-accent/50 bg-accent/15 text-accent-glow shadow-md shadow-accent/10"
                : "border-border/60 bg-surface/40 text-text-muted hover:border-accent/30 hover:text-text-secondary",
            )}
          >
            <span className="text-sm font-bold tracking-widest">
              {meta.short}
            </span>
            {state === "locked" && (
              <span className="text-[9px] text-no/70">
                {COPY.oracle.locked}
              </span>
            )}
            {state === "upcoming" && opensInLabel?.[key] && (
              <span className="text-[9px] text-text-muted">
                {COPY.oracle.opensIn} {opensInLabel[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export type { SlotKey };
