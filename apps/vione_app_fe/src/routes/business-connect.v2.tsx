import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV2 } from "@/components/landing/BusinessConnectLandingV2";

export const Route = createFileRoute("/business-connect/v2")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v2 — Apple-like Minimalism | VIONE" },
      {
        name: "description",
        content: "Mẫu giao diện v2: Phong cách Apple-style Minimalism (Light Mode), chữ Charcoal, Overlap Reveal scroll và Partial Background abstract crops.",
      },
    ],
  }),
  component: BusinessConnectV2Page,
});

function BusinessConnectV2Page() {
  return <BusinessConnectLandingV2 />;
}
