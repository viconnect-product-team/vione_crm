import { createFileRoute } from "@tanstack/react-router";
import { Ceo1983VerticalLandscape } from "@/components/landing/Ceo1983VerticalLandscape";

const TITLE = "CLB Doanh Nhân CEO 1983 — Bức Tranh 3D Khổ Dọc Liên Tục";
const DESC = "Hành trình trải nghiệm bức tranh 3D khổ dọc liên tục: Sky, Birds, Kites, Villas, Water và Underwater Leadership của CLB Doanh nhân CEO 1983 (HanoiBA).";

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
  return <Ceo1983VerticalLandscape />;
}

