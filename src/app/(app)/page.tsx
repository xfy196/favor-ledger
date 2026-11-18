import Link from "next/link";
import { RecordForm } from "@/components/record-form";
import { RecordList } from "@/components/record-list";
import { listMembers } from "@/lib/actions/members";
import { listPersonNames, listRecords } from "@/lib/actions/records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  const params = await searchParams;
  const filterPerson = params.person?.trim() || undefined;

  const [records, members, personNames] = await Promise.all([
    listRecords(filterPerson),
    listMembers(),
    listPersonNames(),
  ]);

  return (
    <div className="fl-page flex flex-col gap-5">
      {filterPerson ? (
        <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            仅看
            <Badge variant="secondary">{filterPerson}</Badge>
          </span>
          <Button variant="link" size="sm" render={<Link href="/" />}>
            清除
          </Button>
        </div>
      ) : null}

      <RecordForm members={members} personNames={personNames} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
            最近记录
          </h2>
          <span className="text-xs text-muted-foreground">{records.length} 笔</span>
        </div>
        <RecordList
          records={records}
          members={members}
          personNames={personNames}
        />
      </section>
    </div>
  );
}
