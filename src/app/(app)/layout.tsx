import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-2xl px-4 py-5 pb-[calc(var(--bottom-nav-h)+24px)] sm:pb-10">
        {children}
      </main>
    </>
  );
}
