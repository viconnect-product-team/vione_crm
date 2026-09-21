// BC-8.1 Turn C §A — Business Connect Notification Center route.

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { BcNotificationCenter } from "@/components/business-connect/notification/BcNotificationCenter";

export const Route = createFileRoute("/business-connect/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications — Business Connect" },
      {
        name: "description",
        content:
          "Recipient-scoped Business Connect notifications with quiet-hours-aware delivery and category preferences.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <BcNotificationCenter />
      </main>
    </AppShell>
  );
}
