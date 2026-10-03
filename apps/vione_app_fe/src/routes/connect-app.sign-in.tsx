import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/connect-app/sign-in")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/vione/login",
      search,
    });
  },
  component: () => null,
});
