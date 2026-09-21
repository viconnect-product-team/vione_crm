import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLanding } from "@/components/landing/BusinessConnectLanding";

export const Route = createFileRoute("/business-connect/v1")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v1 — Đô Thị & Ma Trận Doanh Nghiệp | VIONE" },
      {
        name: "description",
        content: "Mẫu giao diện v1: Phong cách Đại đô thị hiện đại, mạng lưới B2B Matrix, tông màu Obsidian và Vàng Gold sang trọng.",
      },
    ],
  }),
  component: BusinessConnectV1Page,
});

function BusinessConnectV1Page() {
  return <BusinessConnectLanding />;
}
