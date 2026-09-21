// BC-Mobile-7B+ — Màn quản trị yêu cầu tham gia cộng đồng (leaf).

import { createFileRoute } from "@tanstack/react-router";
import { CommunityJoinAdminRequests } from "@/components/business-connect/mobile/community/CommunityJoinAdminRequests";

export const Route = createFileRoute("/connect-app/community/requests")({
  head: () => ({
    meta: [
      { title: "Yêu cầu tham gia cộng đồng — ViOne" },
      {
        name: "description",
        content: "Xem các yêu cầu tham gia cộng đồng cùng ghi chú người gửi kèm theo.",
      },
      { property: "og:title", content: "Yêu cầu tham gia cộng đồng — ViOne" },
      {
        property: "og:description",
        content: "Xem các yêu cầu tham gia cộng đồng cùng ghi chú người gửi kèm theo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectAppCommunityJoinRequestsPage,
});

function ConnectAppCommunityJoinRequestsPage() {
  return <CommunityJoinAdminRequests />;
}
