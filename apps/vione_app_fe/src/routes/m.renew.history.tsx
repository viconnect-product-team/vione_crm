import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocRenewHistoryRoute } from "./association.renew.history";

export const Route = createFileRoute("/m/renew/history")({
  component: AssocRenewHistoryRoute.options.component as any,
});
