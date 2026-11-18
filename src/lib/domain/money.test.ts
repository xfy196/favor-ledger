import { describe, expect, it } from "vitest";
import { formatYuan, parseAmountInput, yuanToCents } from "./money";

describe("money", () => {
  it("converts yuan to cents", () => {
    expect(yuanToCents(800)).toBe(80000);
    expect(yuanToCents("12.34")).toBe(1234);
  });

  it("rejects invalid amounts", () => {
    expect(() => parseAmountInput("")).toThrow();
    expect(() => parseAmountInput("0")).toThrow();
    expect(() => parseAmountInput("-1")).toThrow();
    expect(() => parseAmountInput("1.234")).toThrow();
  });

  it("formats yuan", () => {
    expect(formatYuan(80000)).toBe("800");
    expect(formatYuan(1234)).toBe("12.34");
  });
});
