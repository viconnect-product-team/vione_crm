import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/landing/ceo/v1")({
  beforeLoad: () => {
    throw redirect({ to: "/landing" });
  },
  component: () => null,
});
