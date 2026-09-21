// BC-5.1 — Business Connect › Connections workspace.
// Unified surface for Discover / Incoming / Sent / Connected tabs, backed by
// the canonical ConnectionSDK + RelationshipGraphSDK (via ConnectionsWorkspace).

import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { ConnectionsWorkspace } from "@/components/business-connect/ConnectionsWorkspace";
import {
  CONNECTION_TABS,
  connectionSearchSchema,
  normalizeConnectionSearch,
  type ConnectionTab,
} from "@/lib/connection/route-search";

export const Route = createFileRoute("/business-connect/connections/")({
  ssr: false,
  validateSearch: zodValidator(connectionSearchSchema),
  // Clamp unknown tab values so `?tab=xyz` deep-links land safely on Discover.
  search: {
    middlewares: [
      ({ search, next }) => {
        const raw = search as { tab?: string; q?: string; cursor?: string | null };
        const tab = (CONNECTION_TABS as readonly string[]).includes(raw.tab ?? "")
          ? (raw.tab as ConnectionTab)
          : "discover";
        return next({ ...raw, tab });
      },
    ],
  },
  head: () => ({
    meta: [
      { title: "Kết nối — Business Connect" },
      {
        name: "description",
        content:
          "Khám phá, gửi và quản lý kết nối kinh doanh: gợi ý, yêu cầu đến, yêu cầu đã gửi và người đã kết nối.",
      },
    ],
  }),
  component: BusinessConnectConnections,
});

function BusinessConnectConnections() {
  const raw = Route.useSearch();
  // Route.useSearch is already validated; normalize is a belt-and-suspenders
  // clamp for the tab union (avoids leaking `string` from zod fallback).
  const _normalized = normalizeConnectionSearch(raw);
  void _normalized;
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ConnectionsWorkspace />
    </div>
  );
}
