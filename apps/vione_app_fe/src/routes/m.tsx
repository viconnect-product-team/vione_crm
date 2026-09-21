import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/m")({
  beforeLoad: ({ location }) => {
    const target = location.pathname.replace(/^\/m/, "/association") || "/association";
    throw redirect({
      to: target as any,
      search: location.search as any,
    });
  },
  component: () => <Outlet />,
});
