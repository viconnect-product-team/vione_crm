import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocLibraryRoute } from "./association.library";

export const Route = createFileRoute("/m/library")({
  component: AssocLibraryRoute.options.component as any,
});
