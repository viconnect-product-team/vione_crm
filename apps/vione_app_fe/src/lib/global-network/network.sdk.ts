// BC-3.1C — GlobalNetworkSDK (client-facing façade).
// The ONLY entry point UI/hook code uses to reach Global Business Networking.
// Re-implemented to make direct, clean REST API requests to the NestJS backend
// using fetchNestApi instead of TanStack Start server functions (which compile
// into unreadable query stubs in the browser Network tab).

import { fetchNestApi } from "@/lib/api-client";
import type { GnNotificationDTO, GnNotificationPrefs, ReportUserInput } from "./abuse.types";
import type {
  CounterpartSummary,
  GlobalConnectionDTO,
  GlobalConnectionMutationResult,
  ListOptions,
  PairState,
  StatusCounts,
  SendRequestInput,
  ReasonInput,
} from "./types";

export const GlobalNetworkSDK = {
  connections: {
    /** Accepted (mutual) connections for the current user. */
    listAccepted: (options?: ListOptions): Promise<GlobalConnectionDTO[]> => {
      const q = new URLSearchParams();
      if (options?.limit !== undefined) q.set("limit", String(options.limit));
      if (options?.offset !== undefined) q.set("offset", String(options.offset));
      const qs = q.toString();
      return fetchNestApi(`/connect-app/network/connections${qs ? `?${qs}` : ""}`);
    },
    /** Incoming pending requests (current user is recipient). */
    listIncoming: (options?: ListOptions): Promise<GlobalConnectionDTO[]> => {
      const q = new URLSearchParams();
      if (options?.limit !== undefined) q.set("limit", String(options.limit));
      if (options?.offset !== undefined) q.set("offset", String(options.offset));
      const qs = q.toString();
      return fetchNestApi(`/connect-app/network/requests/incoming${qs ? `?${qs}` : ""}`);
    },
    /** Outgoing pending requests (current user is requester). */
    listOutgoing: (options?: ListOptions): Promise<GlobalConnectionDTO[]> => {
      const q = new URLSearchParams();
      if (options?.limit !== undefined) q.set("limit", String(options.limit));
      if (options?.offset !== undefined) q.set("offset", String(options.offset));
      const qs = q.toString();
      return fetchNestApi(`/connect-app/network/requests/outgoing${qs ? `?${qs}` : ""}`);
    },
    /** Participant-scoped counts by status. */
    countByStatus: (): Promise<StatusCounts> =>
      fetchNestApi("/connect-app/network/connections/status-counts"),
    /** A single participant-scoped connection. */
    getById: (connectionId: string): Promise<GlobalConnectionDTO> =>
      fetchNestApi(`/connect-app/network/connection/${connectionId}`),
    /** Directional pair state relative to the current user. */
    getState: (targetUserId: string): Promise<PairState> =>
      fetchNestApi(`/connect-app/network/state?targetUserId=${targetUserId}`),
  },

  mutations: {
    sendRequest: (input: SendRequestInput): Promise<GlobalConnectionMutationResult> =>
      fetchNestApi("/connect-app/network/requests", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    accept: (connectionId: string, mutationKey?: string): Promise<GlobalConnectionMutationResult> =>
      fetchNestApi(`/connect-app/network/connections/${connectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted", mutationKey }),
      }),
    decline: (connectionId: string, input?: ReasonInput): Promise<GlobalConnectionMutationResult> =>
      fetchNestApi(`/connect-app/network/connections/${connectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "declined", reason: input?.reason, mutationKey: input?.mutationKey }),
      }),
    cancel: (connectionId: string, mutationKey?: string): Promise<GlobalConnectionMutationResult> =>
      fetchNestApi(`/connect-app/network/connections/${connectionId}`, {
        method: "DELETE",
      }),
    disconnect: (
      connectionId: string,
      input?: ReasonInput,
    ): Promise<GlobalConnectionMutationResult> =>
      fetchNestApi(`/connect-app/network/connections/${connectionId}`, {
        method: "DELETE",
      }),
    block: (targetUserId: string, input?: ReasonInput): Promise<GlobalConnectionMutationResult> =>
      fetchNestApi("/connect-app/network/blocks", {
        method: "POST",
        body: JSON.stringify({ targetUserId, reason: input?.reason, mutationKey: input?.mutationKey }),
      }),
  },

  counterparts: {
    /** Privacy-safe PUBLIC summaries for a batch of counterpart user ids. */
    resolvePublic: (userIds: string[]): Promise<CounterpartSummary[]> =>
      fetchNestApi("/connect-app/network/connections/resolve", {
        method: "POST",
        body: JSON.stringify({ userIds }),
      }),
  },

  // BC-3.1F — abuse controls.
  abuse: {
    /** Report a user for review (rate limited server-side). */
    report: (input: ReportUserInput): Promise<{ reportId: string }> =>
      fetchNestApi("/connect-app/network/abuse/reports", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  // BC-3.1F — networking notification center.
  notifications: {
    list: (limit?: number): Promise<GnNotificationDTO[]> => {
      const q = limit ? `?limit=${limit}` : "";
      return fetchNestApi(`/connect-app/notifications${q}`);
    },
    unreadCount: (): Promise<{ count: number }> =>
      fetchNestApi("/connect-app/notifications/unread-count"),
    markRead: (ids?: string[]): Promise<{ updated: number }> =>
      fetchNestApi("/connect-app/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    getPrefs: (): Promise<GnNotificationPrefs> =>
      fetchNestApi("/connect-app/notifications/prefs"),
    setPrefs: (prefs: GnNotificationPrefs): Promise<GnNotificationPrefs> =>
      fetchNestApi("/connect-app/notifications/prefs", {
        method: "POST",
        body: JSON.stringify(prefs),
      }),
  },
};

export type GlobalNetworkSDKType = typeof GlobalNetworkSDK;
