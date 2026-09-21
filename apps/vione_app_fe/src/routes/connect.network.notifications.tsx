import { createFileRoute } from "@tanstack/react-router";
import { NetworkNotificationsView } from "@/components/connect/NetworkNotificationsView";

export const Route = createFileRoute("/connect/network/notifications")({
  ssr: false,
  component: () => <NetworkNotificationsView />,
});
