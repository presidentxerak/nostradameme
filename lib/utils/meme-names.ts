import { fnv1a } from "@/lib/utils/hash";

const ADJECTIVES = [
  "wagmi",
  "ngmi",
  "based",
  "sigma",
  "pepe",
  "degen",
  "ape",
  "moon",
  "rekt",
  "chad",
  "virgin",
  "hodl",
  "fomo",
  "fud",
  "gm",
  "gn",
  "ser",
  "anon",
] as const;

const NOUNS = [
  "lord",
  "frog",
  "oracle",
  "prophet",
  "monk",
  "wizard",
  "sage",
  "seer",
  "dreamer",
  "degen",
  "trader",
  "caller",
  "whale",
  "shrimp",
  "ape",
] as const;

export function generateMemeUsername(userId: string): string {
  const h = fnv1a(userId);
  const adj = ADJECTIVES[h % ADJECTIVES.length] ?? "anon";
  const noun = NOUNS[Math.floor(h / ADJECTIVES.length) % NOUNS.length] ?? "oracle";
  return `${adj}_${noun}`;
}

export function resolveUsername(
  userId: string,
  customUsername: string | null | undefined,
): string {
  if (customUsername && customUsername.trim().length > 0) {
    return customUsername.trim();
  }
  return generateMemeUsername(userId);
}

const AVATAR_COUNT = 0;

export function avatarUrlFor(userId: string): string {
  if (AVATAR_COUNT > 0) {
    const h = fnv1a(userId);
    const idx = (h % AVATAR_COUNT) + 1;
    return `/icons/avatars/avatar-${String(idx).padStart(2, "0")}.png`;
  }
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(
    userId,
  )}&backgroundColor=12121a`;
}
