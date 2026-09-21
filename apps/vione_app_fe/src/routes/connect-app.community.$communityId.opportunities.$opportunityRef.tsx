import { createFileRoute } from "@tanstack/react-router";
import { CommunityOpportunityDetail } from "@/components/business-connect/mobile/community/CommunityOpportunityDetail";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/opportunities/$opportunityRef",
)({
  component: CommunityOpportunityDetailPage,
});

function CommunityOpportunityDetailPage() {
  const { communityId, opportunityRef } = Route.useParams();
  return <CommunityOpportunityDetail communityId={communityId} opportunityRef={opportunityRef} />;
}
