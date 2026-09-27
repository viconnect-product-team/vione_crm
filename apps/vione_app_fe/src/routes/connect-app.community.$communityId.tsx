// BC-Mobile-7A — Community Layout (renders child routes or index detail).

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/connect-app/community/$communityId")({
  head: () => ({
    meta: [{ title: "Cộng đồng — ViOne" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <Outlet />,
});

