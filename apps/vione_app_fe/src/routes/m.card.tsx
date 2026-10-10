import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocCardRoute } from "./association.card";

export const Route = createFileRoute("/m/card")({
  component: AssocCardRoute.options.component as any,
});
