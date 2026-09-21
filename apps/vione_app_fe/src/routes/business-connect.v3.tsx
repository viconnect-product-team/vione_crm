import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV3 } from "@/components/landing/BusinessConnectLandingV3";

export const Route = createFileRoute("/business-connect/v3")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v3 — Neobrutalism (Đậm Chất Startup) | VIONE" },
      {
        name: "description",
        content: "Mẫu giao diện v3: Phong cách Neobrutalism, nền be (#FDF7E4), viền đen dày, bóng đổ cứng khối, dải phân cách Solid Wipe và sticker cutout trôi nổi.",
      },
    ],
  }),
  component: BusinessConnectV3Page,
});

function BusinessConnectV3Page() {
  return <BusinessConnectLandingV3 />;
}
