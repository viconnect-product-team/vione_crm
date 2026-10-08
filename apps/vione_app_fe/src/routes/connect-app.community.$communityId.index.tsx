// BC-Mobile-7A — Community Detail (leaf index).

import { createFileRoute } from "@tanstack/react-router";
import { CommunityDetail } from "@/components/business-connect/mobile/community/CommunityDetail";
import { sanitizeCommunityId } from "@/hooks/use-community";

export const Route = createFileRoute("/connect-app/community/$communityId/")({
  head: () => ({
    meta: [{ title: "Chi tiết cộng đồng — ViOne" }, { name: "robots", content: "noindex" }],
  }),
  component: ConnectAppCommunityDetailIndexPage,
});

function ConnectAppCommunityDetailIndexPage() {
  const { communityId: rawId } = Route.useParams();
  const cleanId = sanitizeCommunityId(rawId);

  return <CommunityDetail communityId={cleanId} />;
}
