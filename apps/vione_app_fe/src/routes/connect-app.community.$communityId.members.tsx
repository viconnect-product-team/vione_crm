import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/members",
)({
  head: () => ({
    meta: [
      { title: "Thành viên — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
