import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLanding } from "@/components/landing/BusinessConnectLanding";

const TITLE = "Business Connect — Hệ Điều Hành Kết Nối Kinh Doanh & Hiệp Hội Doanh Nghiệp";
const DESC = "Nền tảng hợp nhất quản lý hội viên 360°, kết nối giao thương B2B, sự kiện thông minh và AI Copilot.";

export const Route = createFileRoute("/landing/business-connect")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:site_name", content: "Business Connect" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: BusinessConnectLandingPage,
});

function BusinessConnectLandingPage() {
  return <BusinessConnectLanding />;
}
