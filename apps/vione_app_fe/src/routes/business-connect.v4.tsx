import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV4 } from "@/components/landing/BusinessConnectLandingV4";

export const Route = createFileRoute("/business-connect/v4")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v4 — Glassmorphism & Không Gian 3D (Web3) | VIONE" },
      {
        name: "description",
        content: "Mẫu giao diện v4: Phong cách Glassmorphism (Dark Mode), Deep 3D Scroll, dải Aurora gradient và khối đồ họa 3D xoay phản chiếu ánh sáng.",
      },
    ],
  }),
  component: BusinessConnectV4Page,
});

function BusinessConnectV4Page() {
  return <BusinessConnectLandingV4 />;
}
