// BC-9.1 Turn C1/C2 — Relationship Memory hub route.
// Read-only surface: shows viewer's memory (no subject filter = "mine")
// plus the C2 Explorer (search / filters / conflicts / history).

import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useT } from "@/lib/i18n";
import {
  RelationshipMemoryExplorer,
  RelationshipMemoryList,
  RelationshipMemoryTimeline,
} from "@/components/business-connect/relationship-memory";

export const Route = createFileRoute("/business-connect/memory")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Relationship Memory — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RelationshipMemoryPage,
});

function RelationshipMemoryPage() {
  const t = useT();
  return (
    <div>
      <PageHeader title={t("bc.memory.title")} subtitle={t("bc.memory.subtitle")} />
      <Card className="mb-4 p-4 text-xs text-muted-foreground">{t("bc.memory.disclaimer")}</Card>

      <div className="mb-8">
        <RelationshipMemoryExplorer />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label={t("bc.memory.list.title")}>
          <RelationshipMemoryList />
        </section>
        <section aria-label={t("bc.memory.timeline.title")}>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {t("bc.memory.timeline.title")}
          </h2>
          <RelationshipMemoryTimeline />
        </section>
      </div>
    </div>
  );
}
