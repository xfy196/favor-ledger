"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRecord, type RecordView } from "@/lib/actions/records";
import { formatYuan } from "@/lib/domain/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { RecordForm } from "./record-form";

type Member = { id: string; name: string };

export function RecordList({
  records,
  members,
  personNames,
}: {
  records: RecordView[];
  members: Member[];
  personNames: string[];
}) {
  const [editing, setEditing] = useState<RecordView | null>(null);
  const [deleting, setDeleting] = useState<RecordView | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      await deleteRecord(deleting.id);
      setDeleting(null);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">编辑记录</h2>
          <Button variant="link" onClick={() => setEditing(null)}>
            取消
          </Button>
        </div>
        <RecordForm
          members={members}
          personNames={personNames}
          editing={editing}
          onDone={() => setEditing(null)}
        />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Empty className="border border-dashed bg-card/70">
        <EmptyHeader>
          <EmptyTitle>还没有记录</EmptyTitle>
          <EmptyDescription>先在上方记一笔收礼或回礼吧。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <ul className="divide-y">
            {records.map((record) => (
              <li
                key={record.id}
                className="px-4 py-3.5 transition-colors hover:bg-muted/40"
                style={{ contentVisibility: "auto", containIntrinsicSize: "0 96px" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{record.person}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          record.direction === "in"
                            ? "bg-recv-soft text-recv"
                            : "bg-give-soft text-give",
                        )}
                      >
                        {record.direction === "in" ? "收" : "送"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {record.date}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "fl-amount mt-1 text-xl font-semibold",
                        record.direction === "in" ? "text-recv" : "text-give",
                      )}
                    >
                      ¥{formatYuan(record.amountCents)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {record.occasion || "无事由"} · {record.member}
                    </p>
                    {record.pairSummary ? (
                      <p className="mt-1.5 text-sm text-foreground/75">
                        {record.pairSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setEditing(record)}
                      disabled={isPending}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleting(record)}
                      disabled={isPending}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              {deleting?.direction === "in" && deleting.status !== "pending"
                ? "该收礼已配对，删除后将解除对应回礼的配对。"
                : "删除后不可恢复。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
