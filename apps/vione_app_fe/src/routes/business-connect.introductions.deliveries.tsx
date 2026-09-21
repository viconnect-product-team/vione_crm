// BC-6.3 — Intermediary delivery workspace route.
import { createFileRoute } from "@tanstack/react-router";
import { IntroductionDeliveriesWorkspace } from "@/components/business-connect/introduction/delivery/IntroductionDeliveriesWorkspace";

export const Route = createFileRoute("/business-connect/introductions/deliveries")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Deliver Introductions — Business Connect" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "Deliver accepted introduction requests to your target contacts.",
      },
    ],
  }),
  component: IntroductionDeliveriesWorkspace,
});
