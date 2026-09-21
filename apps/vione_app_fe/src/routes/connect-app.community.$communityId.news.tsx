import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/connect-app/community/$communityId/news",
)({
  head: () => ({
    meta: [
      { title: "Bảng tin cộng đồng — ViOne Business Connect" },
      {
        name: "description",
        content: "Tin hoạt động mới nhất của cộng đồng bạn đang tham gia.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
