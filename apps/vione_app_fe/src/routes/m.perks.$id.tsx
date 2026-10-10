import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocPerksDetailRoute } from "./association.perks.$id";

export const Route = createFileRoute("/m/perks/$id")({
  component: AssocPerksDetailRoute.options.component as any,
});
