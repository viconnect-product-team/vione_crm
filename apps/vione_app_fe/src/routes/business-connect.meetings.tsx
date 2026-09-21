// BC-7.8 Turn B — Meetings segment layout (Outlet for index + detail).
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/business-connect/meetings")({
  component: () => <Outlet />,
});
