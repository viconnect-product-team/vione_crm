import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/opportunities",
)({
  head: () => ({
    meta: [
      { title: "Cơ hội kinh doanh — ViOne" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
