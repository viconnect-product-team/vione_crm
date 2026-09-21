// BC-6.2 — Introduction Requests workspace route.
import { createFileRoute } from "@tanstack/react-router";
import { IntroductionRequestsWorkspace } from "@/components/business-connect/introduction/request/IntroductionRequestsWorkspace";

export const Route = createFileRoute("/business-connect/introductions/requests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Introduction Requests — Business Connect" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "Manage the introduction requests you have sent or received through your network.",
      },
    ],
  }),
  component: IntroductionRequestsWorkspace,
});
