import { createFileRoute } from "@tanstack/react-router";
import { CommunityMembers } from "@/components/business-connect/mobile/community/CommunityMembers";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/members/",
)({
  component: ConnectAppCommunityMembersIndexPage,
});

function ConnectAppCommunityMembersIndexPage() {
  const { communityId } = Route.useParams();
  return <CommunityMembers communityId={communityId} />;
}
