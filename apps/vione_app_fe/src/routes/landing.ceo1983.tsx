import { createFileRoute } from "@tanstack/react-router";
import { Ceo1983BlueWhiteGoldLanding } from "@/components/landing/Ceo1983BlueWhiteGoldLanding";

const TITLE = "CLB Doanh Nhân CEO 1983 — Nâng Tầm Vị Thế, Mở Rộng Đế Chế Kinh Doanh";
const DESC = "Cộng đồng tinh hoa dành riêng cho Lãnh đạo cấp cao sinh năm 1983 (Quý Hợi). Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA).";

export const Route = createFileRoute("/landing/ceo1983")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:site_name", content: "CLB CEO 1983" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: Ceo1983LandingPage,
});

function Ceo1983LandingPage() {
  return <Ceo1983BlueWhiteGoldLanding />;
}
