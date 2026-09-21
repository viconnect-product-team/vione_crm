// BC-Mobile-5E — /connect-app/network/requests: incoming connection requests.
// Auth-guarded by the /connect-app parent layout; private by design.

import { createFileRoute } from "@tanstack/react-router";
import { NetworkRequestsView } from "@/components/business-connect/mobile/NetworkRequestsView";

export const Route = createFileRoute("/connect-app/network/requests")({
  head: () => ({
    meta: [{ title: "Lời mời kết nối — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: NetworkRequestsView,
});
