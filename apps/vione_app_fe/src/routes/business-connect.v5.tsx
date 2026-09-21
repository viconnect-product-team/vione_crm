import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV5 } from "@/components/landing/BusinessConnectLandingV5";

export const Route = createFileRoute("/business-connect/v5")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v5 — Isometric & Soft B2B (Phong Cách Stripe) | VIONE" },
      {
        name: "description",
        content: "Mẫu giao diện v5: Phong cách Soft B2B chuẩn mực Stripe, chuyển sắc chéo pastel nhẹ, divider dạng sóng/lát cắt và đồ họa Isometric trôi nổi đa tầng.",
      },
    ],
  }),
  component: BusinessConnectV5Page,
});

function BusinessConnectV5Page() {
  return <BusinessConnectLandingV5 />;
}
