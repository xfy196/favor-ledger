"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const links = [
  { href: "/", label: "记账", short: "记" },
  { href: "/relations", label: "往来", short: "往" },
  { href: "/data", label: "数据", short: "数" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-2xl items-center justify-between px-4">
          <Link href="/" className="fl-brand text-[22px] text-foreground">
            人情记账簿
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    buttonVariants({
                      variant: active ? "default" : "ghost",
                      size: "sm",
                    }),
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid h-[var(--bottom-nav-h)] max-w-2xl grid-cols-3">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                    active && "bg-primary text-primary-foreground",
                  )}
                >
                  {link.short}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
