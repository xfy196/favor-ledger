"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearLedger, exportJson, importJson } from "@/lib/actions/data";
import { addMember, removeMember } from "@/lib/actions/members";
import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

type Member = { id: string; name: string; createdAt: number };

export function DataPanel({
  members,
  userEmail,
}: {
  members: Member[];
  userEmail: string;
}) {
  const router = useRouter();
  const [newMember, setNewMember] = useState("");
  const [message, setMessage] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [isPending, startTransition] = useTransition();

  function onExport() {
    startTransition(async () => {
      const result = await exportJson();
      if (!result.ok || !result.data) {
        setMessage(result.ok ? "导出失败" : result.error);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `favor-ledger-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("已导出 JSON");
    });
  }

  function onImport(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        try {
          const payload = JSON.parse(String(reader.result));
          const result = await importJson(payload);
          if (!result.ok || !result.data) {
            setMessage(result.ok ? "导入失败" : result.error);
            return;
          }
          const { imported, skipped, warnings } = result.data;
          setMessage(
            `导入完成：新增 ${imported}，跳过 ${skipped}${
              warnings.length ? `；警告 ${warnings.length} 条` : ""
            }`,
          );
          router.refresh();
        } catch {
          setMessage("JSON 解析失败");
        }
      });
    };
    reader.readAsText(file);
  }

  function onClear() {
    startTransition(async () => {
      const result = await clearLedger();
      setClearOpen(false);
      setMessage(result.ok ? "已清空记录" : result.error);
      router.refresh();
    });
  }

  function onAddMember() {
    startTransition(async () => {
      const result = await addMember(newMember);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setNewMember("");
      setMessage("已添加成员");
      router.refresh();
    });
  }

  function onRemoveMember() {
    if (!removing) return;
    startTransition(async () => {
      const result = await removeMember(removing.id);
      setRemoving(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      const count = result.data?.referencedCount ?? 0;
      setMessage(
        count > 0
          ? `已删除成员，仍有 ${count} 条记录引用该名称`
          : "已删除成员",
      );
      router.refresh();
    });
  }

  async function onLogout() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>账号</CardTitle>
          <CardDescription>{userEmail}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onLogout}>
            退出登录
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>备份</CardTitle>
          <CardDescription>导出、导入或清空家庭记录</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={onExport} disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            导出 JSON
          </Button>
          <Button variant="outline" className="relative" disabled={isPending}>
            导入 JSON
            <input
              type="file"
              accept="application/json,.json"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => onImport(e.target.files?.[0] ?? null)}
            />
          </Button>
          <Button
            variant="destructive"
            onClick={() => setClearOpen(true)}
            disabled={isPending}
          >
            清空记录
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>经手成员</CardTitle>
          <CardDescription>删除成员不会改写历史记录上的经手名</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="divide-y rounded-lg border">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between px-3 py-2.5 text-sm"
              >
                <span>{m.name}</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setRemoving(m)}
                  disabled={isPending}
                >
                  删除
                </Button>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex gap-2">
            <Field className="flex-1">
              <FieldLabel htmlFor="new-member" className="sr-only">
                新成员
              </FieldLabel>
              <Input
                id="new-member"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="新成员名"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddMember();
                  }
                }}
              />
            </Field>
            <Button onClick={onAddMember} disabled={isPending}>
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>清空全部记录？</DialogTitle>
            <DialogDescription>
              将删除本家庭全部人情记录，此操作不可撤销。成员配置会保留。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={onClear} disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>删除成员「{removing?.name}」？</DialogTitle>
            <DialogDescription>
              记录上的经手名会保留原字符串，不会自动迁移。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={onRemoveMember}
              disabled={isPending}
            >
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
