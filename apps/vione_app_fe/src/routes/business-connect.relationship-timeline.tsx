// BC-7.5 / BC-7.5C — Relationship Timeline product surface (viewer scope).

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageKit";
import { useT } from "@/lib/i18n";
import { useViewerPersonNodeId } from "@/hooks/use-viewer-person-node";
import { RelationshipTimeline } from "@/components/business-connect/timeline";

export const Route = createFileRoute("/business-connect/relationship-timeline")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Relationship Timeline — Business Connect" },
      {
        name: "description",
        content:
          "Chronological, privacy-safe view of your relationship history across connections, introductions and meetings.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RelationshipTimelinePage,
});

function RelationshipTimelinePage() {
  const t = useT();
  const viewer = useViewerPersonNodeId();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <PageHeader title={t("bc.timeline.title")} subtitle={t("bc.timeline.subtitle")} />
      <RelationshipTimeline nodeId={viewer.data ?? null} />
    </div>
  );
}
