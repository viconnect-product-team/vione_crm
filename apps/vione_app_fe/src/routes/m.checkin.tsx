import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocCheckinRoute } from "./association.checkin";

export const Route = createFileRoute("/m/checkin")({
  component: AssocCheckinRoute.options.component as any,
});
