import { DataPanel } from "@/components/data-panel";
import { listMembers } from "@/lib/actions/members";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const [user, members] = await Promise.all([requireUser(), listMembers()]);

  return (
    <div className="fl-page flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold">数据</h1>
        <p className="mt-1 text-sm text-muted-foreground">备份、成员与账号</p>
      </header>
      <DataPanel members={members} userEmail={user.email} />
    </div>
  );
}
