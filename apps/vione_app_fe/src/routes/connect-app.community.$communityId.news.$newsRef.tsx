import { createFileRoute } from "@tanstack/react-router";
import { CommunityNewsDetail } from "@/components/business-connect/mobile/community/CommunityNewsDetail";

export const Route = createFileRoute("/connect-app/community/$communityId/news/$newsRef")({
  head: () => ({
    meta: [
      { title: "Tin cộng đồng — ViOne Business Connect" },
      { name: "description", content: "Nội dung tin hoạt động của cộng đồng." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommunityNewsDetailPage,
});

function CommunityNewsDetailPage() {
  const { communityId, newsRef } = Route.useParams();
  return <CommunityNewsDetail communityId={communityId} newsRef={newsRef} />;
}
