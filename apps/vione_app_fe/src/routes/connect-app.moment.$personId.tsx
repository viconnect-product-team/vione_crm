// BC-Mobile-2E — /connect-app/moment/$personId (Meeting Moment composer).
// Authorization is enforced server-side on prepare/finalize; the composer
// itself fail-closes through the frozen 2C person resolution.

import { createFileRoute } from "@tanstack/react-router";
import { MomentComposer } from "@/components/business-connect/mobile/MomentComposer";

export const Route = createFileRoute("/connect-app/moment/$personId")({
  head: () => ({
    meta: [{ title: "Lưu khoảnh khắc — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: MomentComposerPage,
});

function MomentComposerPage() {
  const { personId } = Route.useParams();
  return <MomentComposer personId={personId} />;
}
