import { createFileRoute } from "@tanstack/react-router";
import { Ceo1983LandingV1 } from "@/components/landing/Ceo1983LandingV1";

const TITLE = "CLB Doanh Nhân CEO 1983 — Nền Tảng Giao Thương Thượng Đỉnh";
const DESC = "Hệ sinh thái kết nối giao thương B2B, quản trị mối quan hệ chiến lược và định danh số độc quyền dành riêng cho Doanh nhân Quý Hợi 1983 (HanoiBA).";

export const Route = createFileRoute("/landing/ceo/v1")({
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
  component: Ceo1983CinematicRoute,
});

function Ceo1983CinematicRoute() {
  return <Ceo1983LandingV1 />;
}

