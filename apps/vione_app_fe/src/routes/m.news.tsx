import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocNewsRoute } from "./association.news";

export const Route = createFileRoute("/m/news")({
  component: AssocNewsRoute.options.component as any,
});
