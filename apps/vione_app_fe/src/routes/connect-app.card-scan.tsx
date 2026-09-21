// BC-Mobile-4A — /connect-app/card-scan (Business Card Capture → OCR →
// Candidate Preview). Auth-guarded by the /connect-app parent layout.

import { createFileRoute } from "@tanstack/react-router";
import { CardScanFlow } from "@/components/business-connect/mobile/card-scan/CardScanFlow";

export const Route = createFileRoute("/connect-app/card-scan")({
  head: () => ({
    meta: [
      { title: "Chụp danh thiếp — Business Connect" },
      {
        name: "description",
        content: "Số hoá danh thiếp giấy bằng AI — bạn xác nhận trước khi lưu.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CardScanFlow,
});
