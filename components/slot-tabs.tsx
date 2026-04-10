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
  const slots: { key: SlotKey; meta: typeof COPY.slots.morning }[] = [
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
              "flex flex-col items-center gap-1 rounded-xl border py-3 text-sm transition",
              isActive
                ? "border-accent bg-accent/20 text-text-primary shadow-lg shadow-accent/20"
                : "border-border bg-surface/60 text-text-secondary hover:border-accent/40",
            )}
          >
            <span className="text-xl">{meta.emoji}</span>
            <span className="font-display tracking-widest uppercase text-xs">
              {meta.short}
            </span>
            {state === "locked" && (
              <span className="text-[10px] text-no-glow">
                {COPY.oracle.locked}
              </span>
            )}
            {state === "upcoming" && opensInLabel?.[key] && (
              <span className="text-[10px] text-text-muted">
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
