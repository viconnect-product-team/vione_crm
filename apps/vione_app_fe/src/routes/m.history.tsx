import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocHistoryRoute } from "./association.history";

export const Route = createFileRoute("/m/history")({
  component: AssocHistoryRoute.options.component as any,
});
