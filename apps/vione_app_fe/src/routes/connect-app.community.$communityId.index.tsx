// BC-Mobile-7A — Community Detail (leaf index).

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CommunityDetail } from "@/components/business-connect/mobile/community/CommunityDetail";
import { sanitizeCommunityId } from "@/hooks/use-community";

export const Route = createFileRoute("/connect-app/community/$communityId/")({
  head: () => ({
    meta: [{ title: "Chi tiết cộng đồng — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: ConnectAppCommunityDetailIndexPage,
});

function ConnectAppCommunityDetailIndexPage() {
  const { communityId: rawId } = Route.useParams();
  const cleanId = sanitizeCommunityId(rawId);
  const navigate = useNavigate();

  useEffect(() => {
    if (rawId && (rawId.includes("/") || rawId.startsWith("http") || rawId !== cleanId)) {
      void navigate({
        to: "/connect-app/community/$communityId",
        params: { communityId: cleanId },
        replace: true,
      });
    }
  }, [rawId, cleanId, navigate]);

  return <CommunityDetail communityId={cleanId} />;
}
