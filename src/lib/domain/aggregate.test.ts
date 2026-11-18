import { describe, expect, it } from "vitest";
import { aggregateByPerson, summarizeLedger } from "./aggregate";

describe("aggregate", () => {
  it("merges by person ignoring member", () => {
    const records = [
      {
        id: "1",
        person: "张三",
        direction: "in" as const,
        amountCents: 80000,
        occasion: "婚礼",
        date: "2026-01-01",
        member: "我",
        note: null,
        targetId: null,
        createdAt: 1,
      },
      {
        id: "2",
        person: "张三",
        direction: "in" as const,
        amountCents: 50000,
        occasion: "满月",
        date: "2026-02-01",
        member: "配偶",
        note: null,
        targetId: null,
        createdAt: 2,
      },
    ];

    const relations = aggregateByPerson(records);
    expect(relations).toHaveLength(1);
    expect(relations[0].recvTotal).toBe(130000);
    expect(relations[0].pendingCount).toBe(2);
    expect(relations[0].personStatus).toBe("has_pending");
  });

  it("summarizes pending amount and short diff", () => {
    const records = [
      {
        id: "in1",
        person: "张三",
        direction: "in" as const,
        amountCents: 80000,
        occasion: "婚礼",
        date: "2026-01-01",
        member: "我",
        note: null,
        targetId: null,
        createdAt: 1,
      },
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 50000,
        occasion: "回礼",
        date: "2026-03-01",
        member: "我",
        note: null,
        targetId: "in1",
        createdAt: 2,
      },
      {
        id: "in2",
        person: "李四",
        direction: "in" as const,
        amountCents: 20000,
        occasion: "乔迁",
        date: "2026-04-01",
        member: "我",
        note: null,
        targetId: null,
        createdAt: 3,
      },
    ];

    const summary = summarizeLedger(records);
    expect(summary.pendingCount).toBe(1);
    expect(summary.pendingPersonCount).toBe(1);
    expect(summary.pendingAmountCents).toBe(20000);
    expect(summary.shortDiffTotalCents).toBe(30000);
  });
});
