// BC-4.1C — Default meetings view → redirect to the "upcoming" section.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/connect/meetings/")({
  beforeLoad: () => {
    throw redirect({ to: "/connect/meetings/$section", params: { section: "upcoming" } });
  },
});
