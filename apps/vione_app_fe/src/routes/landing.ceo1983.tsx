import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/landing/ceo1983")({
  beforeLoad: () => {
    throw redirect({ to: "/landing" });
  },
  component: () => null,
});
