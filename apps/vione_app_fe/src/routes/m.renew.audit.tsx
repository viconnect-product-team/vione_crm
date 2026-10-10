import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocRenewAuditRoute } from "./association.renew.audit";

export const Route = createFileRoute("/m/renew/audit")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : "",
  }),
  component: AssocRenewAuditRoute.options.component as any,
});
