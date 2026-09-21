// BC-Mobile-7A — Community Detail (leaf index).

import { createFileRoute } from "@tanstack/react-router";
import { CommunityDetail } from "@/components/business-connect/mobile/community/CommunityDetail";

export const Route = createFileRoute("/connect-app/community/$communityId/")({
  head: () => ({
    meta: [{ title: "Chi tiết cộng đồng — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: ConnectAppCommunityDetailIndexPage,
});

function ConnectAppCommunityDetailIndexPage() {
  const { communityId } = Route.useParams();
  return <CommunityDetail communityId={communityId} />;
}
