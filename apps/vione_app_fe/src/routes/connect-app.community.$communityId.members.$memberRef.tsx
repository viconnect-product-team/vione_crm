// BC-Mobile-7A — Community member profile (leaf, privacy-safe).

import { createFileRoute } from "@tanstack/react-router";
import { CommunityMemberProfile } from "@/components/business-connect/mobile/community/CommunityMemberProfile";

export const Route = createFileRoute("/connect-app/community/$communityId/members/$memberRef")({
  head: () => ({
    meta: [
      { title: "Hồ sơ thành viên — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectAppCommunityMemberPage,
});

function ConnectAppCommunityMemberPage() {
  const { communityId, memberRef } = Route.useParams();
  return <CommunityMemberProfile communityId={communityId} memberRef={memberRef} />;
}
