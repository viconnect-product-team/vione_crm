import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocRenewResultRoute } from "./association.renew.result";

export const Route = createFileRoute("/m/renew/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  component: AssocRenewResultRoute.options.component as any,
});
