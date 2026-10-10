import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocProfileRoute } from "./association.profile";

export const Route = createFileRoute("/m/profile")({
  component: AssocProfileRoute.options.component as any,
});
