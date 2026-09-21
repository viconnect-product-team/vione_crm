import { createFileRoute } from "@tanstack/react-router";
import { CommunityEventDetail } from "@/components/business-connect/mobile/community/CommunityEventDetail";

export const Route = createFileRoute("/connect-app/community/$communityId/events/$eventRef")({
  component: CommunityEventDetailPage,
});

function CommunityEventDetailPage() {
  const { communityId, eventRef } = Route.useParams();
  return <CommunityEventDetail communityId={communityId} eventRef={eventRef} />;
}
