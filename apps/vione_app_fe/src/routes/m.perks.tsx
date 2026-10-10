import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocPerksRoute } from "./association.perks";

export const Route = createFileRoute("/m/perks")({
  component: AssocPerksRoute.options.component as any,
});
