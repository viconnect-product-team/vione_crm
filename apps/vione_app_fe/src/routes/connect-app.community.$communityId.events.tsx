import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/events",
)({
  head: () => ({
    meta: [
      { title: "Sự kiện cộng đồng — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
