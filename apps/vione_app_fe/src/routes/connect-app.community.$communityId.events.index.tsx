import { createFileRoute } from "@tanstack/react-router";
import { CommunityEvents } from "@/components/business-connect/mobile/community/CommunityEvents";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/events/",
)({
  component: CommunityEventsIndexPage,
});

function CommunityEventsIndexPage() {
  const { communityId } = Route.useParams();
  return <CommunityEvents communityId={communityId} />;
}
