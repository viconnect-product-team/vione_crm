import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocEventsRoute } from "./association.events";

export const Route = createFileRoute("/m/events")({
  component: AssocEventsRoute.options.component as any,
});
