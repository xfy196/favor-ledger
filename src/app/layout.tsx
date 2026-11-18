import type { Metadata } from "next";
import { Noto_Sans_SC, ZCOOL_XiaoWei } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const body = Noto_Sans_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const brand = ZCOOL_XiaoWei({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "人情记账簿",
  description: "家庭人情往来记账：收礼、回礼、配对与两清",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn("h-full font-sans", body.variable, brand.variable)}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
