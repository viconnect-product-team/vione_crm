import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocRenewIndexRoute } from "./association.renew.index";

export const Route = createFileRoute("/m/renew/")({
  component: AssocRenewIndexRoute.options.component as any,
});
