import { describe, expect, it } from "vitest";
import { listPendingInForPerson, validatePairing } from "./pairing";

const records = [
  {
    id: "in1",
    person: "张三",
    direction: "in" as const,
    amountCents: 80000,
    targetId: null,
  },
  {
    id: "in2",
    person: "李四",
    direction: "in" as const,
    amountCents: 50000,
    targetId: null,
  },
];

describe("pairing", () => {
  it("allows pairing same person in", () => {
    const result = validatePairing({
      outRecord: { direction: "out", person: "张三" },
      targetId: "in1",
      all: records,
    });
    expect(result).toEqual({ ok: true, targetId: "in1" });
  });

  it("rejects cross-person pairing", () => {
    const result = validatePairing({
      outRecord: { direction: "out", person: "张三" },
      targetId: "in2",
      all: records,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects already paired target", () => {
    const all = [
      ...records,
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 80000,
        targetId: "in1",
      },
    ];
    const result = validatePairing({
      outRecord: { direction: "out", person: "张三" },
      targetId: "in1",
      all,
    });
    expect(result.ok).toBe(false);
  });

  it("lists only pending in for person", () => {
    const all = [
      ...records,
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 80000,
        targetId: "in1",
      },
    ];
    expect(listPendingInForPerson("张三", all).map((r) => r.id)).toEqual([]);
    expect(listPendingInForPerson("李四", all).map((r) => r.id)).toEqual(["in2"]);
  });
});
