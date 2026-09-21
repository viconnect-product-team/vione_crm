// BC-6.4 — Introduction outcomes route.
import { createFileRoute } from "@tanstack/react-router";
import { IntroductionOutcomesWorkspace } from "@/components/business-connect/introduction/outcome/IntroductionOutcomesWorkspace";

export const Route = createFileRoute("/business-connect/introductions/outcomes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kết quả giới thiệu — Business Connect" },
      {
        name: "description",
        content:
          "Theo dõi kết quả sau khi giới thiệu được chuyển đến người nhận: đã kết nối, có tiến triển, hoặc đóng lại.",
      },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <IntroductionOutcomesWorkspace />
    </div>
  ),
});
