import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV6 } from "@/components/landing/BusinessConnectLandingV6";

export const Route = createFileRoute("/business-connect/v6")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v6 — Kim Tự Tháp Huyền Bí (Khắc Đá & Giải Mã Cổ Đại) | VIONE" },
      {
        name: "description",
        content: "Phiên bản v6: Phong cách Kim Tự Tháp Huyền Bí, bão cát sa mạc, giải mã ký tự tượng hình Hieroglyphs, con trỏ bọ hung Scarab và trụ đá Obelisk 3D.",
      },
    ],
  }),
  component: BusinessConnectV6Page,
});

function BusinessConnectV6Page() {
  return <BusinessConnectLandingV6 />;
}
