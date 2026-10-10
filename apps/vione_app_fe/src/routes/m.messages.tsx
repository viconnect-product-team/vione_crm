import { createFileRoute } from "@tanstack/react-router";
import { Route as AssocMessagesRoute } from "./association.messages";

export const Route = createFileRoute("/m/messages")({
  component: AssocMessagesRoute.options.component as any,
});
