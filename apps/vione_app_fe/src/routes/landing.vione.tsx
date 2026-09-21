import { createFileRoute } from "@tanstack/react-router";
import { ViOneGoldWhiteLanding } from "@/components/landing/ViOneGoldWhiteLanding";

const TITLE = "ViOne Connect — Hệ Điều Hành Kết Nối Kinh Doanh & CRM Hợp Nhất";
const DESC =
  "Hệ sinh thái kết nối kinh doanh 5.0: Ứng dụng ViOne Connect, Nền tảng CRM Doanh nghiệp cô lập và Danh thiếp số Titanium NFC 1-chạm.";

export const Route = createFileRoute("/landing/vione")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:site_name", content: "ViOne Connect" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: ViOneOfficialLandingPage,
});

function ViOneOfficialLandingPage() {
  return <ViOneGoldWhiteLanding />;
}
