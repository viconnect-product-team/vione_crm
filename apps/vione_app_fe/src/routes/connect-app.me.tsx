// BC-Mobile — /connect-app/me layout: renders child routes (index, edit, ...).

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/connect-app/me")({
  component: () => <Outlet />,
});
