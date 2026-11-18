import { RelationsPanel } from "@/components/relations-panel";
import { listRelations } from "@/lib/actions/relations";

export const dynamic = "force-dynamic";

export default async function RelationsPage() {
  const { relations, summary } = await listRelations();

  return (
    <div className="fl-page flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold">人情往来</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          按人查看待回礼与两清
        </p>
      </header>
      <RelationsPanel relations={relations} summary={summary} />
    </div>
  );
}
