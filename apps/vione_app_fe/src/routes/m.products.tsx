import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocProductsRoute } from "./association.products";

export const Route = createFileRoute("/m/products")({
  component: AssocProductsRoute.options.component as any,
});
