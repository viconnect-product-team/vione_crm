import { createFileRoute } from "@tanstack/react-router";
import { CommunityOpportunities } from "@/components/business-connect/mobile/community/CommunityOpportunities";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/opportunities/",
)({
  component: CommunityOpportunitiesIndexPage,
});

function CommunityOpportunitiesIndexPage() {
  const { communityId } = Route.useParams();
  return <CommunityOpportunities communityId={communityId} />;
}
