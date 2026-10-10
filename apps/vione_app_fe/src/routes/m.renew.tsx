import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocRenewRoute } from "./association.renew";

export const Route = createFileRoute("/m/renew")({
  component: AssocRenewRoute.options.component as any,
});
