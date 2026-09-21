// BC-6.1 — Smart Introduction route.
// Read-only surface. Uses target id from URL params; source derived server-side.
import { createFileRoute } from "@tanstack/react-router";
import { SmartIntroductionPage } from "@/components/business-connect/introduction/SmartIntroductionPage";

export const Route = createFileRoute("/business-connect/introductions/$targetPersonNodeId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Smart Introduction — Business Connect" },
      {
        name: "description",
        content:
          "Discover trusted introduction paths through your network to reach the right person.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { targetPersonNodeId } = Route.useParams();
  return <SmartIntroductionPage targetPersonNodeId={targetPersonNodeId} />;
}
