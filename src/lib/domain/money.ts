export function yuanToCents(yuan: number | string): number {
  const n = typeof yuan === "string" ? Number(yuan) : yuan;
  if (!Number.isFinite(n)) {
    throw new Error("金额必须是数字");
  }
  if (n <= 0) {
    throw new Error("金额必须大于 0");
  }
  const cents = Math.round(n * 100);
  if (Math.abs(n * 100 - cents) > 1e-6) {
    // tolerate float noise; reject more than 2 decimal places
    const text = String(yuan);
    if (/\.\d{3,}/.test(text)) {
      throw new Error("金额最多两位小数");
    }
  }
  if (cents <= 0) {
    throw new Error("金额必须大于 0");
  }
  return cents;
}

export function centsToYuan(cents: number): number {
  return cents / 100;
}

export function formatYuan(cents: number): string {
  return centsToYuan(cents).toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function parseAmountInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("金额不能为空");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("金额格式不正确，最多两位小数");
  }
  return yuanToCents(trimmed);
}
