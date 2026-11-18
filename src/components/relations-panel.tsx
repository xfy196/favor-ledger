"use client";

import Link from "next/link";
import { useState } from "react";
import type { LedgerSummary, PersonRelation } from "@/lib/domain/aggregate";
import { formatYuan } from "@/lib/domain/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function personStatusLabel(status: PersonRelation["personStatus"]) {
  switch (status) {
    case "has_pending":
      return "待回礼";
    case "all_even":
      return "两清";
    case "has_over":
      return "回多";
  }
}

export function RelationsPanel({
  relations,
  summary,
}: {
  relations: PersonRelation[];
  summary: LedgerSummary;
}) {
  const [open, setOpen] = useState<string | null>(
    relations.find((r) => r.pendingCount > 0)?.name ?? null,
  );

  const stats = [
    { label: "总收", value: `¥${formatYuan(summary.recvTotal)}`, tone: "recv" as const },
    { label: "总送", value: `¥${formatYuan(summary.giveTotal)}`, tone: "give" as const },
    { label: "待回礼", value: `${summary.pendingCount} 笔` },
    { label: "待回人数", value: `${summary.pendingPersonCount} 人` },
    { label: "待回金额", value: `¥${formatYuan(summary.pendingAmountCents)}` },
    { label: "回少差额", value: `¥${formatYuan(summary.shortDiffTotalCents)}` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="grid grid-cols-2 gap-px bg-border p-0 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card px-3 py-3">
              <p className="text-[11px] tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p
                className={cn(
                  "fl-amount mt-1 text-[15px] font-semibold",
                  stat.tone === "recv" && "text-recv",
                  stat.tone === "give" && "text-give",
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {relations.length === 0 ? (
        <Empty className="border border-dashed bg-card/70">
          <EmptyHeader>
            <EmptyTitle>暂无人情往来</EmptyTitle>
            <EmptyDescription>录入记录后会按对方姓名聚合。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            <ul className="divide-y">
              {relations.map((person) => {
                const expanded = open === person.name;
                return (
                  <li
                    key={person.name}
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: "0 88px",
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                      onClick={() => setOpen(expanded ? null : person.name)}
                      aria-expanded={expanded}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold">
                            {person.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              person.personStatus === "has_pending" &&
                                "bg-recv-soft text-recv",
                              person.personStatus === "has_over" &&
                                "bg-give-soft text-give",
                            )}
                          >
                            {personStatusLabel(person.personStatus)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          收 ¥{formatYuan(person.recvTotal)} · 送 ¥
                          {formatYuan(person.giveTotal)} · {person.count} 笔
                        </p>
                        <p className="mt-0.5 text-sm text-foreground/80">
                          待回 {person.pendingCount} · 两清 {person.evenCount} ·
                          回少 {person.shortCount}
                        </p>
                      </div>
                      <span className="mt-1 shrink-0 text-xs text-muted-foreground">
                        {expanded ? "收起" : "展开"}
                      </span>
                    </button>

                    {expanded ? (
                      <div className="flex flex-col gap-2 border-t bg-muted/30 px-4 py-3">
                        {person.pendingDetails.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            无待回礼事项
                          </p>
                        ) : (
                          person.pendingDetails.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="min-w-0 truncate text-muted-foreground">
                                {d.date} · {d.occasion || "无事由"}
                              </span>
                              <span className="fl-amount shrink-0 font-medium text-recv">
                                ¥{formatYuan(d.amountCents)}
                              </span>
                            </div>
                          ))
                        )}
                        <Separator />
                        <Button
                          variant="link"
                          className="h-auto justify-start px-0"
                          render={
                            <Link
                              href={`/?person=${encodeURIComponent(person.name)}`}
                            />
                          }
                        >
                          查看该人记录 →
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
