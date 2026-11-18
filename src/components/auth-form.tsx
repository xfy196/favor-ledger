"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        if (mode === "register") {
          const result = await authClient.signUp.email({
            email,
            password,
            name: name.trim() || email.split("@")[0],
          });
          if (result.error) {
            setError(result.error.message || "注册失败");
            return;
          }
        } else {
          const result = await authClient.signIn.email({ email, password });
          if (result.error) {
            setError(result.error.message || "登录失败");
            return;
          }
        }
        router.replace("/");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "请求失败");
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <div className="fl-page mb-8 text-center">
        <p className="fl-brand text-[40px] leading-none text-foreground">
          人情记账簿
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {mode === "login" ? "登录家庭账本" : "邮箱注册，一分钟开始记账"}
        </p>
      </div>

      <Card className="fl-page">
        <CardHeader>
          <CardTitle>{mode === "login" ? "登录" : "注册"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "使用邮箱与密码进入账本"
              : "注册后自动创建家庭账本"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="auth-form" onSubmit={onSubmit}>
            <FieldGroup>
              {mode === "register" ? (
                <Field>
                  <FieldLabel htmlFor="name">昵称</FieldLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="可选"
                    autoComplete="nickname"
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">密码</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="至少 8 位"
                />
              </Field>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            form="auth-form"
            className="h-10 w-full"
            disabled={isPending}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {mode === "login" ? "登录" : "注册"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                还没有账号？{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  注册
                </Link>
              </>
            ) : (
              <>
                已有账号？{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  登录
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
