// BC-Mobile-7A — /connect-app/community layout route.
// The page bodies live in the leaf routes (index / $communityId / members /
// member profile). Auth + shell come from the /connect-app parent.

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";

export const Route = createFileRoute("/connect-app/community")({
  component: ConnectAppCommunityLayout,
});

function ConnectAppCommunityLayout() {
  return (
    <MobilePage>
      <Outlet />
    </MobilePage>
  );
}
