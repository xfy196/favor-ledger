import { describe, expect, it } from "vitest";
import { resolveRecordStatus, statusLabel } from "./status";

const base = [
  {
    id: "in1",
    person: "张三",
    direction: "in" as const,
    amountCents: 80000,
    targetId: null,
  },
  {
    id: "in2",
    person: "张三",
    direction: "in" as const,
    amountCents: 50000,
    targetId: null,
  },
];

describe("status", () => {
  it("marks unpaired in as pending", () => {
    const r = resolveRecordStatus(base[0], base);
    expect(r.status).toBe("pending");
    expect(statusLabel(r.status, r.diffCents)).toBe("待回礼");
  });

  it("detects even / short / over", () => {
    const even = [
      ...base,
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 80000,
        targetId: "in1",
      },
    ];
    expect(resolveRecordStatus(even[0], even).status).toBe("even");

    const short = [
      base[0],
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 50000,
        targetId: "in1",
      },
    ];
    const s = resolveRecordStatus(short[0], short);
    expect(s.status).toBe("short");
    expect(s.diffCents).toBe(-30000);

    const over = [
      base[0],
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 100000,
        targetId: "in1",
      },
    ];
    const o = resolveRecordStatus(over[0], over);
    expect(o.status).toBe("over");
    expect(o.diffCents).toBe(20000);
  });

  it("keeps other pending when one is settled", () => {
    const all = [
      ...base,
      {
        id: "out1",
        person: "张三",
        direction: "out" as const,
        amountCents: 80000,
        targetId: "in1",
      },
    ];
    expect(resolveRecordStatus(all[0], all).status).toBe("even");
    expect(resolveRecordStatus(all[1], all).status).toBe("pending");
  });
});
