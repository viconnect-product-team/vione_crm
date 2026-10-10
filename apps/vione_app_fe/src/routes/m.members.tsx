import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocMembersRoute } from "./association.members";

export const Route = createFileRoute("/m/members")({
  component: AssocMembersRoute.options.component as any,
});
