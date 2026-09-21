// BC-Mobile-2C — Person Detail (read-only foundation).
// Resolves the opaque `$personId` (`u:<userId>` | `c:<targetCardId>`) through
// the frozen 2C data contract. No mutations, no mock data, fail-closed on
// unauthorized or missing relationships (one unified unavailable state).
// BC-Mobile-2E: `?momentSaved` renders the post-save confirmation banner.

import { createFileRoute } from "@tanstack/react-router";
import { PersonDetail } from "@/components/business-connect/mobile/PersonDetail";

export const Route = createFileRoute("/connect-app/network/$personId")({
  validateSearch: (search: Record<string, unknown>): { momentSaved?: true } =>
    search.momentSaved === true ? { momentSaved: true } : {},
  head: () => ({
    meta: [{ title: "Hồ sơ — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: ConnectAppPersonPage,
});

function ConnectAppPersonPage() {
  const { personId } = Route.useParams();
  const { momentSaved } = Route.useSearch();
  return <PersonDetail personId={personId} momentSaved={momentSaved === true} />;
}
