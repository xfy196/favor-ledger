export type Direction = "in" | "out";

export type PairStatus = "pending" | "even" | "short" | "over" | "unpaired";

export type RecordLike = {
  id: string;
  person: string;
  direction: Direction;
  amountCents: number;
  targetId: string | null;
};

export function pairDiffCents(
  giftInCents: number,
  giftOutCents: number,
): number {
  return giftOutCents - giftInCents;
}

export function statusFromDiff(diffCents: number): Exclude<PairStatus, "pending" | "unpaired"> {
  if (diffCents === 0) return "even";
  if (diffCents < 0) return "short";
  return "over";
}

/** Resolve status for a single record given the full set (same family). */
export function resolveRecordStatus(
  record: RecordLike,
  all: RecordLike[],
): { status: PairStatus; diffCents: number | null; pairId: string | null } {
  if (record.direction === "in") {
    const pairedOut = all.find(
      (r) => r.direction === "out" && r.targetId === record.id,
    );
    if (!pairedOut) {
      return { status: "pending", diffCents: null, pairId: null };
    }
    const diff = pairDiffCents(record.amountCents, pairedOut.amountCents);
    return {
      status: statusFromDiff(diff),
      diffCents: diff,
      pairId: pairedOut.id,
    };
  }

  if (!record.targetId) {
    return { status: "unpaired", diffCents: null, pairId: null };
  }

  const target = all.find((r) => r.id === record.targetId);
  if (!target || target.direction !== "in") {
    return { status: "unpaired", diffCents: null, pairId: null };
  }

  const diff = pairDiffCents(target.amountCents, record.amountCents);
  return {
    status: statusFromDiff(diff),
    diffCents: diff,
    pairId: target.id,
  };
}

export function statusLabel(
  status: PairStatus,
  diffCents: number | null,
): string {
  switch (status) {
    case "pending":
      return "待回礼";
    case "even":
      return "两清";
    case "short":
      return `回少 ${Math.abs(diffCents ?? 0) / 100}`;
    case "over":
      return `回多 ${(diffCents ?? 0) / 100}`;
    case "unpaired":
      return "未配对";
  }
}
