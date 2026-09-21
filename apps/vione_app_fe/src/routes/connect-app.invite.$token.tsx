// BC — Nhận lời mời tham gia cộng đồng bằng liên kết token.

import { createFileRoute } from "@tanstack/react-router";
import { CommunityInviteAccept } from "@/components/business-connect/mobile/community/CommunityInviteAccept";

export const Route = createFileRoute("/connect-app/invite/$token")({
  head: () => ({
    meta: [
      { title: "Lời mời tham gia cộng đồng — Business Connect" },
      { name: "description", content: "Xác nhận email để chấp nhận lời mời tham gia cộng đồng." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectAppInvitePage,
});

function ConnectAppInvitePage() {
  const { token } = Route.useParams();
  return <CommunityInviteAccept token={token} />;
}
