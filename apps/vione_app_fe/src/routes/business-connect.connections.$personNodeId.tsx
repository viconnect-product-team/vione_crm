// BC-7.5C — Relationship detail surface hosting the pair timeline.
// Route: /business-connect/connections/$personNodeId
//
// Read-only. Consumes RelationshipTimelineSDK via hooks (pair mode). Header
// pulls minimal identity fields from existing SDKs when available; otherwise
// degrades to neutral wording. No new relationship aggregate is introduced.

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useViewerPersonNodeId } from "@/hooks/use-viewer-person-node";
import { RelationshipTimeline } from "@/components/business-connect/timeline";
import { RelationshipMemorySummary } from "@/components/business-connect/relationship-memory";

export const Route = createFileRoute("/business-connect/connections/$personNodeId")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Relationship — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: RelationshipDetailPage,
});

function RelationshipDetailPage() {
  const t = useT();
  const { personNodeId } = Route.useParams();
  const viewer = useViewerPersonNodeId();
  const viewerNode = viewer.data ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/business-connect/connections">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {t("bc.timeline.person.back")}
          </Link>
        </Button>
      </div>

      <PageHeader
        title={t("bc.timeline.person.title")}
        subtitle={t("bc.timeline.person.subtitle")}
      />

      <Card className="mb-4 p-4 text-xs text-muted-foreground">{t("bc.timeline.disclaimer")}</Card>

      <div className="mb-4">
        <RelationshipMemorySummary subject={{ type: "person", ref: personNodeId }} />
      </div>

      <RelationshipTimeline mode="pair" nodeA={viewerNode} nodeB={personNodeId} />
    </div>
  );
}
