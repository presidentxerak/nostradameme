import { describe, it, expect } from "vitest";
import { computeResolution } from "@/lib/markets/resolver";

describe("cron resolution (pure)", () => {
  it("gte resolves YES when price >= threshold", () => {
    expect(computeResolution(82500, 82000, "gte")).toBe("yes");
    expect(computeResolution(82000, 82000, "gte")).toBe("yes");
    expect(computeResolution(81999, 82000, "gte")).toBe("no");
  });
  it("lte resolves YES when price <= threshold", () => {
    expect(computeResolution(80000, 82000, "lte")).toBe("yes");
    expect(computeResolution(82000, 82000, "lte")).toBe("yes");
    expect(computeResolution(82500, 82000, "lte")).toBe("no");
  });
});
