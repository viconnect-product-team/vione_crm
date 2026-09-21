// BC-Mobile-2E — /connect-app/moment layout route (Outlet-only parent).
// Children: index = person picker, $personId = the composer.

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/connect-app/moment")({
  component: () => <Outlet />,
});
