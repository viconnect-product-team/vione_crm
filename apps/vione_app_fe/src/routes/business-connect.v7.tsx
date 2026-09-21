import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV7 } from "@/components/landing/BusinessConnectLandingV7";

export const Route = createFileRoute("/business-connect/v7")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v7 — Bong Bóng Bay (Trôi Nổi & Đàn Hồi Tối Giản) | VIONE" },
      {
        name: "description",
        content: "Phiên bản v7: Phong cách Bong Bóng Bay trôi nổi, tối giản dẻo dai, bọt xà phòng phát sáng sinh học và tương tác nổ bọt khí rớt confetti.",
      },
    ],
  }),
  component: BusinessConnectV7Page,
});

function BusinessConnectV7Page() {
  return <BusinessConnectLandingV7 />;
}
