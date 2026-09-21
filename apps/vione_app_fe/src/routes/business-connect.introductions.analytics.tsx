// BC-6.7 — Introduction analytics route.
import { createFileRoute } from "@tanstack/react-router";
import { IntroductionAnalyticsWorkspace } from "@/components/business-connect/introduction/analytics/IntroductionAnalyticsWorkspace";

export const Route = createFileRoute("/business-connect/introductions/analytics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Phân tích giới thiệu — Business Connect" },
      {
        name: "description",
        content:
          "Phân tích quan sát về phễu, thời gian và hiệu năng của các giới thiệu — không có điểm thành công AI, không có bảng xếp hạng công khai.",
      },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <IntroductionAnalyticsWorkspace />
    </div>
  ),
});
