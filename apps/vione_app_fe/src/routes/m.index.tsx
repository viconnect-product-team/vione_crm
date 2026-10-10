import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocIndexRoute } from "./association.index";

export const Route = createFileRoute("/m/")({
  component: AssocIndexRoute.options.component as any,
});
