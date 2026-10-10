import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocRenewPayRoute } from "./association.renew.pay";

export const Route = createFileRoute("/m/renew/pay")({
  component: AssocRenewPayRoute.options.component as any,
});
