import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/association/benefits")({
  beforeLoad: () => {
    throw redirect({
      to: "/association/perks",
      replace: true,
    });
  },
  component: () => null,
});
