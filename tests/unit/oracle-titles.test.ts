import { describe, expect, it } from "vitest";
import {
  ORACLE_TITLES,
  getOracleTitle,
  getOracleTitleString,
  MIN_PREDICTIONS_FOR_TITLE,
} from "@/lib/oracle/titles";

describe("ORACLE_TITLES", () => {
  it("has 7 tiers plus default", () => {
    expect(ORACLE_TITLES).toHaveLength(7);
  });
});

describe("getOracleTitle", () => {
  it("returns default when predictions < min", () => {
    const t = getOracleTitle(90, MIN_PREDICTIONS_FOR_TITLE - 1);
    expect(t.title).toContain("Seeker");
  });
  it("returns Blind Prophet for 0-20%", () => {
    const t = getOracleTitle(10, 10);
    expect(t.title).toContain("Blind Prophet");
  });
  it("returns True Oracle for 60%", () => {
    const t = getOracleTitle(60, 10);
    expect(t.title).toContain("True Oracle");
  });
  it("returns Nostradameme Himself at 95%", () => {
    const t = getOracleTitle(95, 100);
    expect(t.title).toContain("Nostradameme");
  });
  it("exposes string helper", () => {
    const s = getOracleTitleString(70, 20);
    expect(s).toContain("Enlightened One");
  });
});
