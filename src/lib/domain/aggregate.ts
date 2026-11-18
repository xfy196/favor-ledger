import {
  resolveRecordStatus,
  type RecordLike,
} from "./status";

export type PendingDetail = {
  id: string;
  amountCents: number;
  occasion: string | null;
  date: string;
};

export type PersonRelation = {
  name: string;
  recvTotal: number;
  giveTotal: number;
  count: number;
  pendingCount: number;
  shortCount: number;
  evenCount: number;
  overCount: number;
  pendingAmountCents: number;
  lastDate: string;
  personStatus: "has_pending" | "all_even" | "has_over";
  pendingDetails: PendingDetail[];
};

export type LedgerSummary = {
  recvTotal: number;
  giveTotal: number;
  pendingCount: number;
  pendingPersonCount: number;
  pendingAmountCents: number;
  shortDiffTotalCents: number;
};

export type RecordWithMeta = {
  id: string;
  person: string;
  direction: "in" | "out";
  amountCents: number;
  occasion: string | null;
  date: string;
  member: string;
  note: string | null;
  targetId: string | null;
  createdAt: number;
};

export function aggregateByPerson(
  records: RecordWithMeta[],
): PersonRelation[] {
  const byPerson = new Map<string, RecordWithMeta[]>();
  for (const r of records) {
    const list = byPerson.get(r.person) ?? [];
    list.push(r);
    byPerson.set(r.person, list);
  }

  const allLike: RecordLike[] = records.map((r) => ({
    id: r.id,
    person: r.person,
    direction: r.direction,
    amountCents: r.amountCents,
    targetId: r.targetId,
  }));

  const relations: PersonRelation[] = [];

  for (const [name, list] of byPerson) {
    let recvTotal = 0;
    let giveTotal = 0;
    let pendingCount = 0;
    let shortCount = 0;
    let evenCount = 0;
    let overCount = 0;
    let pendingAmountCents = 0;
    let lastDate = "";
    const pendingDetails: PendingDetail[] = [];

    for (const r of list) {
      if (r.direction === "in") recvTotal += r.amountCents;
      else giveTotal += r.amountCents;
      if (r.date > lastDate) lastDate = r.date;

      const { status, diffCents } = resolveRecordStatus(r, allLike);
      if (r.direction === "in") {
        if (status === "pending") {
          pendingCount += 1;
          pendingAmountCents += r.amountCents;
          pendingDetails.push({
            id: r.id,
            amountCents: r.amountCents,
            occasion: r.occasion,
            date: r.date,
          });
        } else if (status === "short") shortCount += 1;
        else if (status === "even") evenCount += 1;
        else if (status === "over") overCount += 1;
      } else if (status === "short") {
        // counted on in side primarily; keep even/short/over on in for F2.2
      }
      void diffCents;
    }

    // Recount short/even/over from in records only (事项状态)
    shortCount = 0;
    evenCount = 0;
    overCount = 0;
    for (const r of list.filter((x) => x.direction === "in")) {
      const { status } = resolveRecordStatus(r, allLike);
      if (status === "short") shortCount += 1;
      else if (status === "even") evenCount += 1;
      else if (status === "over") overCount += 1;
    }

    let personStatus: PersonRelation["personStatus"] = "all_even";
    if (pendingCount > 0) personStatus = "has_pending";
    else if (overCount > 0 && shortCount === 0 && evenCount >= 0) {
      // 有回多且无待回礼
      const hasNonEven = list.some((r) => {
        if (r.direction !== "in") return false;
        const { status } = resolveRecordStatus(r, allLike);
        return status === "over";
      });
      if (hasNonEven && shortCount === 0) personStatus = "has_over";
      else if (shortCount === 0 && pendingCount === 0) personStatus = "all_even";
    }

    if (pendingCount === 0 && overCount > 0 && shortCount === 0) {
      personStatus = "has_over";
    } else if (pendingCount === 0) {
      personStatus = "all_even";
    } else {
      personStatus = "has_pending";
    }

    pendingDetails.sort((a, b) =>
      b.date === a.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date),
    );

    relations.push({
      name,
      recvTotal,
      giveTotal,
      count: list.length,
      pendingCount,
      shortCount,
      evenCount,
      overCount,
      pendingAmountCents,
      lastDate,
      personStatus,
      pendingDetails,
    });
  }

  relations.sort((a, b) => {
    if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
    return b.pendingAmountCents - a.pendingAmountCents;
  });

  return relations;
}

export function summarizeLedger(records: RecordWithMeta[]): LedgerSummary {
  const allLike: RecordLike[] = records.map((r) => ({
    id: r.id,
    person: r.person,
    direction: r.direction,
    amountCents: r.amountCents,
    targetId: r.targetId,
  }));

  let recvTotal = 0;
  let giveTotal = 0;
  let pendingCount = 0;
  let pendingAmountCents = 0;
  let shortDiffTotalCents = 0;
  const pendingPersons = new Set<string>();

  for (const r of records) {
    if (r.direction === "in") recvTotal += r.amountCents;
    else giveTotal += r.amountCents;

    const { status, diffCents } = resolveRecordStatus(r, allLike);
    if (r.direction === "in" && status === "pending") {
      pendingCount += 1;
      pendingAmountCents += r.amountCents;
      pendingPersons.add(r.person);
    }
    if (r.direction === "in" && status === "short" && diffCents !== null) {
      shortDiffTotalCents += Math.abs(diffCents);
    }
  }

  return {
    recvTotal,
    giveTotal,
    pendingCount,
    pendingPersonCount: pendingPersons.size,
    pendingAmountCents,
    shortDiffTotalCents,
  };
}

export function sortRecords<T extends { date: string; createdAt: number }>(
  records: T[],
): T[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
}
