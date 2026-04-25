import { describe, expect, it } from "vitest";
import {
  generateThreshold,
  roundThreshold,
} from "@/lib/markets/thresholds";

describe("roundThreshold", () => {
  it("rounds small values to cents", () => {
    expect(roundThreshold(1.234)).toBe(1.23);
    expect(roundThreshold(99.995)).toBe(100);
  });
  it("rounds mid values to whole dollars", () => {
    expect(roundThreshold(250.4)).toBe(250);
    expect(roundThreshold(999.9)).toBe(1000);
  });
  it("rounds large values to tens", () => {
    expect(roundThreshold(5432)).toBe(5430);
  });
  it("rounds huge values to hundreds", () => {
    expect(roundThreshold(82345)).toBe(82300);
  });
});

describe("generateThreshold", () => {
  it("returns a threshold different from spot price", () => {
    const { thresholdPrice } = generateThreshold(80000, 0.02, "night");
    expect(thresholdPrice).not.toBe(80000);
  });
  it("returns gte or lte operator", () => {
    const { operator } = generateThreshold(80000, 0.02, "morning");
    expect(["gte", "lte"]).toContain(operator);
  });
  it("threshold is within reasonable range of spot", () => {
    const spot = 80000;
    const { thresholdPrice } = generateThreshold(spot, 0.02, "noon");
    expect(thresholdPrice).toBeGreaterThan(spot * 0.7);
    expect(thresholdPrice).toBeLessThan(spot * 1.3);
  });
});
