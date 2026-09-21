import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/business-connect/connections")({
  component: () => <Outlet />,
});
