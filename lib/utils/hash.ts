/**
 * Simple deterministic 32-bit hash (FNV-1a).
 * Used for deterministic selection of meme names and quotes.
 */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function hashToIndex(input: string, bound: number): number {
  if (bound <= 0) return 0;
  return fnv1a(input) % bound;
}
