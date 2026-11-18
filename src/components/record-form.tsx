"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createRecord,
  listPendingTargets,
  updateRecord,
  type RecordView,
} from "@/lib/actions/records";
import { formatYuan } from "@/lib/domain/money";
import { DatePicker } from "@/components/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string };
type PendingTarget = {
  id: string;
  amountCents: number;
  occasion: string | null;
  date: string;
  member: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordForm({
  members,
  personNames,
  editing,
  onDone,
}: {
  members: Member[];
  personNames: string[];
  editing?: RecordView | null;
  onDone?: () => void;
}) {
  const [person, setPerson] = useState(editing?.person ?? "");
  const [direction, setDirection] = useState<"in" | "out">(
    editing?.direction ?? "in",
  );
  const [amount, setAmount] = useState(
    editing ? String(editing.amountCents / 100) : "",
  );
  const [occasion, setOccasion] = useState(editing?.occasion ?? "");
  const [date, setDate] = useState(editing?.date ?? today());
  const [member, setMember] = useState(
    editing?.member ?? members[0]?.name ?? "我",
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [showNote, setShowNote] = useState(Boolean(editing?.note));
  const [targetId, setTargetId] = useState<string>(
    editing?.targetId ?? "__none__",
  );
  const [pending, setPending] = useState<PendingTarget[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const trimmedPerson = person.trim();

  const duplicateName = useMemo(() => {
    if (!trimmedPerson) return false;
    if (editing && editing.person === trimmedPerson) return false;
    return personNames.includes(trimmedPerson);
  }, [trimmedPerson, personNames, editing]);

  const suggestions = useMemo(() => {
    if (!trimmedPerson) return [];
    return personNames
      .filter((n) => n.includes(trimmedPerson) && n !== trimmedPerson)
      .slice(0, 6);
  }, [trimmedPerson, personNames]);

  function formatPendingLabel(p: PendingTarget) {
    return `${p.date} · ${p.occasion || "无事由"} · ¥${formatYuan(p.amountCents)}`;
  }

  useEffect(() => {
    if (direction !== "out") {
      setPending([]);
      setPendingLoading(false);
      return;
    }
    if (!trimmedPerson) {
      setPending([]);
      setPendingLoading(false);
      setTargetId("__none__");
      return;
    }

    let cancelled = false;
    setPendingLoading(true);
    listPendingTargets(trimmedPerson, editing?.id)
      .then((rows) => {
        if (cancelled) return;
        setPending(rows);
        setTargetId((current) => {
          if (rows.some((row) => row.id === current)) return current;
          // 仅一条待回礼时默认选中，方便回礼
          if (rows.length === 1 && !editing?.id) return rows[0].id;
          return "__none__";
        });
      })
      .finally(() => {
        if (!cancelled) setPendingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [direction, trimmedPerson, editing?.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload = {
        person,
        direction,
        amount,
        occasion,
        date,
        member,
        note,
        targetId:
          direction === "out" && targetId !== "__none__" ? targetId : null,
      };
      const result = editing
        ? await updateRecord({ id: editing.id, ...payload })
        : await createRecord(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!editing) {
        setPerson("");
        setAmount("");
        setNote("");
        setTargetId("__none__");
        setShowNote(false);
      }
      router.refresh();
      onDone?.();
    });
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
          <ToggleGroup
            value={[direction]}
            onValueChange={(values) => {
              const next = values[0] as "in" | "out" | undefined;
              if (next) setDirection(next);
            }}
            className="grid w-full grid-cols-2 gap-1 rounded-lg bg-secondary p-1"
            spacing={0}
          >
            <ToggleGroupItem
              value="in"
              className={cn(
                "h-9 flex-1 rounded-md border-0 data-[pressed]:bg-recv data-[pressed]:text-white",
              )}
            >
              收礼
            </ToggleGroupItem>
            <ToggleGroupItem
              value="out"
              className={cn(
                "h-9 flex-1 rounded-md border-0 data-[pressed]:bg-give data-[pressed]:text-white",
              )}
            >
              回礼
            </ToggleGroupItem>
          </ToggleGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="person">对方姓名</FieldLabel>
              <Input
                id="person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                list="person-suggestions"
                placeholder="张三"
                required
                autoComplete="off"
              />
              <datalist id="person-suggestions">
                {suggestions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>

            {duplicateName ? (
              <Alert className="border-transparent bg-[var(--warn-bg)] text-[var(--warn)]">
                <AlertDescription>
                  已有同名。同一人可直接保存；不同人请加后缀（如「张三-同事」）。
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="amount">金额</FieldLabel>
                <InputGroup className="h-10">
                  <InputGroupAddon>
                    <InputGroupText>¥</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="800"
                    required
                    className="fl-amount text-base font-semibold"
                  />
                </InputGroup>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[200, 500, 800, 1000].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="xs"
                      variant={amount === String(n) ? "default" : "secondary"}
                      onClick={() => setAmount(String(n))}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="date">日期</FieldLabel>
                <DatePicker id="date" value={date} onChange={setDate} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="occasion">事由</FieldLabel>
                <Input
                  id="occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="婚礼 / 满月"
                />
              </Field>
              <Field>
                <FieldLabel>经手</FieldLabel>
                <Select
                  value={member}
                  onValueChange={(value) => {
                    if (value) setMember(value);
                  }}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                      {editing &&
                      !members.some((m) => m.name === editing.member) ? (
                        <SelectItem value={editing.member}>
                          {editing.member}
                        </SelectItem>
                      ) : null}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {direction === "out" ? (
              <Field>
                <FieldLabel>配对待回礼</FieldLabel>
                {!trimmedPerson ? (
                  <FieldDescription>
                    请先填写对方姓名，将自动加载其未配对的收礼记录。
                  </FieldDescription>
                ) : pendingLoading ? (
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground">
                    <Spinner />
                    正在查询待回礼…
                  </div>
                ) : (
                  <Select
                    key={`pending-${trimmedPerson}-${pending.map((p) => p.id).join(",")}`}
                    value={targetId}
                    onValueChange={(value) => {
                      if (value) setTargetId(value);
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="不关联">
                        {(value: string | null) => {
                          if (!value || value === "__none__") return "不关联";
                          const hit = pending.find((p) => p.id === value);
                          return hit ? formatPendingLabel(hit) : "不关联";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__none__">不关联</SelectItem>
                        {pending.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {formatPendingLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                {trimmedPerson && !pendingLoading && pending.length === 0 ? (
                  <FieldDescription>
                    「{trimmedPerson}」暂无未配对的收礼记录，可先不关联直接保存。
                  </FieldDescription>
                ) : null}
                {trimmedPerson && !pendingLoading && pending.length > 0 ? (
                  <FieldDescription>
                    共 {pending.length} 笔待回礼收礼，请选择要配对的一笔。
                  </FieldDescription>
                ) : null}
              </Field>
            ) : null}

            {showNote ? (
              <Field>
                <FieldLabel htmlFor="note">备注</FieldLabel>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="可选"
                  className="min-h-16 resize-none"
                />
              </Field>
            ) : (
              <Button
                type="button"
                variant="link"
                className="h-auto justify-start px-0 text-muted-foreground"
                onClick={() => setShowNote(true)}
              >
                + 添加备注
              </Button>
            )}

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="h-10 w-full" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {editing ? "保存修改" : "保存"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
