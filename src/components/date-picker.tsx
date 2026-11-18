"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseYmd(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DatePicker({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full justify-between px-2.5 font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="truncate">
          {selected
            ? format(selected, "yyyy年M月d日", { locale: zhCN })
            : "选择日期"}
        </span>
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={zhCN}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between border-t px-2.5 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            清除
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(format(new Date(), "yyyy-MM-dd"));
              setOpen(false);
            }}
          >
            今天
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
