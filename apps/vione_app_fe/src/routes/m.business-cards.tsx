import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocBusinessCardsRoute } from "./association.business-cards";

export const Route = createFileRoute("/m/business-cards")({
  component: AssocBusinessCardsRoute.options.component as any,
});
