import { createFileRoute } from "@tanstack/react-router";
import { ViOneLandingWebOfficial } from "@/components/landing/ViOneLandingWebOfficial";

export const Route = createFileRoute("/landing/")({
  head: () => ({
    meta: [
      { title: "ViOne Connect — Hệ Điều Hành Doanh Nghiệp 5.0 Toàn Diện" },
      {
        name: "description",
        content:
          "Nền tảng SaaS Creator AI 5.0, CRM doanh nghiệp cô lập, kết nối kinh doanh B2B và Danh thiếp số Titanium NFC 1-chạm.",
      },
      { property: "og:title", content: "ViOne Connect — Business Connection OS & Enterprise CRM" },
    ],
  }),
  component: ViOneLandingPage,
});

function ViOneLandingPage() {
  return <ViOneLandingWebOfficial />;
}

