// BC-Mobile — /connect-app/me/edit: canonical identity editing page.

import { createFileRoute } from "@tanstack/react-router";
import { IdentityEditPage } from "@/components/business-connect/mobile/me/IdentityEditPage";

export const Route = createFileRoute("/connect-app/me/edit")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chỉnh sửa danh tính — Business Connect" },
      {
        name: "description",
        content: "Cập nhật chức danh, công ty và thông tin liên hệ trên danh tính số của bạn.",
      },
      { property: "og:title", content: "Chỉnh sửa danh tính — Business Connect" },
      {
        property: "og:description",
        content: "Cập nhật chức danh, công ty và thông tin liên hệ trên danh tính số của bạn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IdentityEditPage,
});
