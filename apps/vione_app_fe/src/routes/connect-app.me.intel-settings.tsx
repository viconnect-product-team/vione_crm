// BC-Mobile-6C — /connect-app/me/intel-settings (V personalization settings).

import { createFileRoute } from "@tanstack/react-router";
import { IntelPersonalizationSettings } from "@/components/business-connect/mobile/me/IntelPersonalizationSettings";

export const Route = createFileRoute("/connect-app/me/intel-settings")({
  head: () => ({
    meta: [
      { title: "V · Gợi ý & cá nhân hóa — Business Connect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntelPersonalizationSettings,
});
