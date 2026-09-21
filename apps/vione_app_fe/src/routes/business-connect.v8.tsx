import { createFileRoute } from "@tanstack/react-router";
import { BusinessConnectLandingV8 } from "@/components/landing/BusinessConnectLandingV8";

export const Route = createFileRoute("/business-connect/v8")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect v8 — Executive Titanium Suite | VIONE B2B" },
      {
        name: "description",
        content: "Phiên bản v8: Executive Titanium Suite tích hợp tinh hoa kết nối doanh nghiệp B2B, quản lý quan hệ và xúc tiến thương mại hiệp hội.",
      },
    ],
  }),
  component: BusinessConnectV8Page,
});

function BusinessConnectV8Page() {
  return <BusinessConnectLandingV8 />;
}
