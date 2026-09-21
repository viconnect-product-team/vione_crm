import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/opportunities",
)({
  head: () => ({
    meta: [
      { title: "Cơ hội kinh doanh — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
