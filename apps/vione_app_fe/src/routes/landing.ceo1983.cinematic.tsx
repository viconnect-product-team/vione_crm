import { createFileRoute } from "@tanstack/react-router";
import { Ceo1983CinematicInteractiveWorldLanding } from "@/components/landing/Ceo1983CinematicInteractiveWorldLanding";

const TITLE = "CLB Doanh Nhân CEO 1983 — Hành Trình Điện Ảnh 6 Phân Cảnh (Cinematic Scroll)";
const DESC = "Trải nghiệm cuộn điện ảnh siêu thực 6 phân cảnh độc bản của CLB Doanh Nhân CEO 1983: Bầu trời, Đàn chim, Cánh diều, Dinh thự, Mặt nước và Đỉnh cao Thủy cung.";

export const Route = createFileRoute("/landing/ceo1983/cinematic")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:site_name", content: "CLB CEO 1983 Cinematic" },
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
  return <Ceo1983CinematicInteractiveWorldLanding />;
}
