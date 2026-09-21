// BC-Mobile-2A — /connect-app/network layout route (Outlet-only).
// Fixed in BC-Mobile-2E: this parent previously rendered NetworkHome directly,
// which swallowed the $personId child (live nesting bug). The list experience
// now lives in the index route; the parent only provides the slot.

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/connect-app/network")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});
