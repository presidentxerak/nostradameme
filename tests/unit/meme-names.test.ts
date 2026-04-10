import { describe, expect, it } from "vitest";
import {
  generateMemeUsername,
  resolveUsername,
} from "@/lib/utils/meme-names";

describe("generateMemeUsername", () => {
  it("is deterministic for same userId", () => {
    const a = generateMemeUsername("user-xyz");
    const b = generateMemeUsername("user-xyz");
    expect(a).toBe(b);
  });
  it("produces different results for different userIds", () => {
    const a = generateMemeUsername("user-a");
    const b = generateMemeUsername("user-b");
    expect(a).not.toBe(b);
  });
  it("matches adj_noun pattern", () => {
    const name = generateMemeUsername("id");
    expect(name).toMatch(/^[a-z]+_[a-z]+$/);
  });
});

describe("resolveUsername", () => {
  it("returns custom when provided", () => {
    const r = resolveUsername("user-1", "dopecustom");
    expect(r).toBe("dopecustom");
  });
  it("falls back to meme name when null", () => {
    const r = resolveUsername("user-1", null);
    expect(r).toMatch(/^[a-z]+_[a-z]+$/);
  });
  it("falls back to meme name when empty", () => {
    const r = resolveUsername("user-1", "   ");
    expect(r).toMatch(/^[a-z]+_[a-z]+$/);
  });
});
