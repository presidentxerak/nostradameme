import { COPY } from "@/lib/config/copy";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  if (diff < MINUTE) {
    return `${Math.floor(diff / 1000)}${COPY.liveFeed.secondsAgo}`;
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)}${COPY.liveFeed.minutesAgo}`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}${COPY.liveFeed.hoursAgo}`;
  }
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatRemaining(endIso: string, now = Date.now()): string {
  const end = new Date(endIso).getTime();
  const diff = end - now;
  if (diff <= 0) return "0m";
  const h = Math.floor(diff / HOUR);
  const m = Math.floor((diff % HOUR) / MINUTE);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor((diff % MINUTE) / 1000);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatRemainingLong(endIso: string, now = Date.now()): string {
  const end = new Date(endIso).getTime();
  const diff = end - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const mins = Math.floor((diff % HOUR) / MINUTE);
  const secs = Math.floor((diff % MINUTE) / 1000);
  if (days > 30) {
    const months = Math.floor(days / 30);
    const remDays = days % 30;
    return remDays > 0 ? `${months}mo ${remDays}d ${hours}h ${mins}m ${secs}s` : `${months}mo ${hours}h ${mins}m ${secs}s`;
  }
  if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function msUntil(endIso: string, now = Date.now()): number {
  return Math.max(0, new Date(endIso).getTime() - now);
}

export function isLocked(bettingEndIso: string): boolean {
  return msUntil(bettingEndIso) <= 0;
}

export function hourlySlotStart(date = new Date()): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      0, 0, 0,
    ),
  );
}

export function hourlySlotEnd(date = new Date()): Date {
  return new Date(hourlySlotStart(date).getTime() + HOUR);
}

export function hourToSlotName(utcHour: number): "morning" | "noon" | "night" {
  if (utcHour >= 5 && utcHour < 12) return "morning";
  if (utcHour >= 12 && utcHour < 20) return "noon";
  return "night";
}

export function slotStartUtc(
  slot: "morning" | "noon" | "night",
  date = new Date(),
): Date {
  const hours = slot === "morning" ? 7 : slot === "noon" ? 10 : 22;
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours, 0, 0, 0,
    ),
  );
}

export function slotEndUtc(
  slot: "morning" | "noon" | "night",
  date = new Date(),
): Date {
  const start = slotStartUtc(slot, date);
  const durationHours = slot === "morning" ? 3 : slot === "noon" ? 12 : 9;
  return new Date(start.getTime() + durationHours * HOUR);
}

export function weekStartUtc(date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 5, 0, 0),
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function weekEndUtc(date = new Date()): Date {
  const start = weekStartUtc(date);
  const end = new Date(start.getTime() + 7 * DAY);
  end.setUTCMinutes(59, 59, 0);
  end.setUTCHours(23);
  return end;
}

export function todayUtcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
