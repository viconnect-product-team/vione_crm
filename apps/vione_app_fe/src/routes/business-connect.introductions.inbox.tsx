// BC-6.3 — Target introduction inbox route.
import { createFileRoute } from "@tanstack/react-router";
import { IntroductionInboxWorkspace } from "@/components/business-connect/introduction/delivery/IntroductionInboxWorkspace";

export const Route = createFileRoute("/business-connect/introductions/inbox")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Introduction Inbox — Business Connect" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "Introductions delivered to you by trusted intermediaries in your network.",
      },
    ],
  }),
  component: IntroductionInboxWorkspace,
});
