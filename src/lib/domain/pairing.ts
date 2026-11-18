import type { RecordLike } from "./status";

export type PairingError =
  | "ONLY_OUT_CAN_PAIR"
  | "TARGET_NOT_FOUND"
  | "TARGET_MUST_BE_IN"
  | "PERSON_MISMATCH"
  | "TARGET_ALREADY_PAIRED";

export function validatePairing(input: {
  outRecord: Pick<RecordLike, "direction" | "person">;
  targetId: string | null | undefined;
  all: RecordLike[];
  /** When editing an existing out record, exclude itself from "already paired" check. */
  excludeOutId?: string;
}): { ok: true; targetId: string | null } | { ok: false; error: PairingError } {
  const { outRecord, targetId, all, excludeOutId } = input;

  if (!targetId) {
    return { ok: true, targetId: null };
  }

  if (outRecord.direction !== "out") {
    return { ok: false, error: "ONLY_OUT_CAN_PAIR" };
  }

  const target = all.find((r) => r.id === targetId);
  if (!target) {
    return { ok: false, error: "TARGET_NOT_FOUND" };
  }
  if (target.direction !== "in") {
    return { ok: false, error: "TARGET_MUST_BE_IN" };
  }
  if (target.person !== outRecord.person) {
    return { ok: false, error: "PERSON_MISMATCH" };
  }

  const existing = all.find(
    (r) =>
      r.direction === "out" &&
      r.targetId === targetId &&
      r.id !== excludeOutId,
  );
  if (existing) {
    return { ok: false, error: "TARGET_ALREADY_PAIRED" };
  }

  return { ok: true, targetId };
}

export function pairingErrorMessage(error: PairingError): string {
  switch (error) {
    case "ONLY_OUT_CAN_PAIR":
      return "只有回礼记录可以配对";
    case "TARGET_NOT_FOUND":
      return "配对的收礼记录不存在";
    case "TARGET_MUST_BE_IN":
      return "只能配对收礼记录";
    case "PERSON_MISMATCH":
      return "配对目标必须是同一对方";
    case "TARGET_ALREADY_PAIRED":
      return "该收礼记录已被其他回礼配对";
  }
}

export function listPendingInForPerson(
  person: string,
  all: RecordLike[],
  excludeOutId?: string,
): RecordLike[] {
  const pairedTargetIds = new Set(
    all
      .filter(
        (r) =>
          r.direction === "out" &&
          r.targetId &&
          r.id !== excludeOutId,
      )
      .map((r) => r.targetId as string),
  );

  return all.filter(
    (r) =>
      r.direction === "in" &&
      r.person === person &&
      !pairedTargetIds.has(r.id),
  );
}
