import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/connect/network/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/connect/network/connections" });
  },
});
