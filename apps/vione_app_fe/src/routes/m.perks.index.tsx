import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocPerksIndexRoute } from "./association.perks.index";

export const Route = createFileRoute("/m/perks/")({
  component: AssocPerksIndexRoute.options.component as any,
});
