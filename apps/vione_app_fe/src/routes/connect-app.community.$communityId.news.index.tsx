import { createFileRoute } from "@tanstack/react-router";
import { CommunityNews } from "@/components/business-connect/mobile/community/CommunityNews";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/news/",
)({
  component: CommunityNewsIndexPage,
});

function CommunityNewsIndexPage() {
  const { communityId } = Route.useParams();
  return <CommunityNews communityId={communityId} />;
}
