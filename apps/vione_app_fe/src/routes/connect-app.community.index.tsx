// BC-Mobile-7A — My Communities (leaf).

import { createFileRoute } from "@tanstack/react-router";
import { CommunityHome } from "@/components/business-connect/mobile/community/CommunityHome";

type CommunitySearch = { tab?: "all" | "admin" | "history" };

export const Route = createFileRoute("/connect-app/community/")({
  validateSearch: (search: Record<string, unknown>): CommunitySearch => {
    const tab = search.tab;
    return tab === "admin" || tab === "history" || tab === "all" ? { tab } : {};
  },
  head: () => ({
    meta: [
      { title: "Cộng đồng của tôi — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectAppCommunityPage,
});

function ConnectAppCommunityPage() {
  const { tab } = Route.useSearch();
  return <CommunityHome initialTab={tab} />;
}
