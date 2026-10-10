import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocOpportunitiesRoute } from "./association.opportunities";

export const Route = createFileRoute("/m/opportunities")({
  component: AssocOpportunitiesRoute.options.component as any,
});
