// Route: /connect-app — Business Connect Executive Home (BC-Mobile-1A).
//
// NOT a dashboard: a quiet executive briefing composed from live contracts
// (identity, Work Hub, notifications) via useBusinessConnectHome(). No mock
// or placeholder content remains on this surface.

import { createFileRoute } from "@tanstack/react-router";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { ExecutiveHome } from "@/components/business-connect/mobile/ExecutiveHome";

export const Route = createFileRoute("/connect-app/")({
  head: () => ({
    meta: [
      { title: "Trang chủ — Business Connect" },
      {
        name: "description",
        content:
          "Trang chủ Business Connect: thông tin hôm nay của bạn — cuộc gặp, việc cần làm và kết nối đang chờ.",
      },
      { property: "og:title", content: "Trang chủ — Business Connect" },
      {
        property: "og:description",
        content:
          "Trang chủ Business Connect: thông tin hôm nay của bạn — cuộc gặp, việc cần làm và kết nối đang chờ.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConnectAppHomePage,
});

function ConnectAppHomePage() {
  return (
    <MobilePage>
      <ExecutiveHome />
    </MobilePage>
  );
}
