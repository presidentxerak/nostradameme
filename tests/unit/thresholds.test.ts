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
  it("picks gte when seed >= 0.5", () => {
    const { operator, thresholdPrice } = generateThreshold(
      80000,
      0.02,
      "night",
      0.9,
    );
    expect(operator).toBe("gte");
    expect(thresholdPrice).toBeGreaterThan(80000);
  });
  it("picks lte when seed < 0.5", () => {
    const { operator, thresholdPrice } = generateThreshold(
      80000,
      0.02,
      "night",
      0.1,
    );
    expect(operator).toBe("lte");
    expect(thresholdPrice).toBeLessThan(80000);
  });
  it("respects slot multipliers", () => {
    const weekly = generateThreshold(80000, 0.02, "weekly", 0.9);
    const morning = generateThreshold(80000, 0.02, "morning", 0.9);
    expect(weekly.thresholdPrice).toBeGreaterThanOrEqual(
      morning.thresholdPrice,
    );
  });
});
