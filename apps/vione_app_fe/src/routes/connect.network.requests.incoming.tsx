import { createFileRoute } from "@tanstack/react-router";
import { NetworkSectionView } from "@/components/connect/NetworkSectionView";

export const Route = createFileRoute("/connect/network/requests/incoming")({
  ssr: false,
  component: () => <NetworkSectionView section="incoming" />,
});
