import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocNotificationsRoute } from "./association.notifications";

export const Route = createFileRoute("/m/notifications")({
  component: AssocNotificationsRoute.options.component as any,
});
