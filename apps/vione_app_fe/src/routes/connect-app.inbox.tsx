// BC-Mobile-8A — /connect-app/inbox layout route (chỉ mở slot cho trang con).
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/connect-app/inbox")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});
