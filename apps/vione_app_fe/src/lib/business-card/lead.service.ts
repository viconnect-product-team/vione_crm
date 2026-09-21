// LeadService — the single home for Business Card lead + analytics business
// logic (BC-2.1D): lead projection, status-history / reply-metadata
// composition, and stats aggregation. Server functions are thin adapters that
// call this service. All persistence goes through LeadRepository and
// BusinessCardRepository; this module never queries tables directly.
//
// Statically imports NO *.server file, so it is safe to import from
// *.functions.ts.

import { fetchNestApiFromServer } from "@/lib/api-client";
import type {
  BusinessCardLead,
  BusinessCardStats,
  LeadStatus,
  ReplyChannel,
} from "./lead.types";

export const LeadService = {
  /** List and project all leads owned by the current member. */
  async listMyLeads(token: string): Promise<BusinessCardLead[]> {
    return await fetchNestApiFromServer<BusinessCardLead[]>("/business-cards/leads/me", token);
  },

  /** Change lead status and append a status-history entry. */
  async updateStatus(
    token: string,
    id: string,
    status: LeadStatus,
    note?: string,
  ): Promise<{ ok: boolean }> {
    return await fetchNestApiFromServer<{ ok: boolean }>(
      `/business-cards/leads/${id}/status`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      },
    );
  },

  /** Append a reply entry and optionally mark the lead as responded. */
  async sendReply(
    token: string,
    input: {
      id: string;
      channel: ReplyChannel;
      templateId?: string | null;
      subject?: string | null;
      body: string;
      markResponded?: boolean;
    },
  ): Promise<{ ok: boolean }> {
    return await fetchNestApiFromServer<{ ok: boolean }>(
      `/business-cards/leads/${input.id}/reply`,
      token,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  /** Notification-center workflow: change status AND append history + reply. */
  async processWorkflow(
    token: string,
    id: string,
    status: "read" | "contacting" | "won" | "lost",
    note?: string,
  ): Promise<{ ok: boolean }> {
    return await fetchNestApiFromServer<{ ok: boolean }>(
      `/business-cards/leads/${id}/workflow`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ status, note }),
      },
    );
  },

  /** Aggregate lead + interaction analytics for the current member. */
  async getStats(token: string, days?: number): Promise<BusinessCardStats> {
    try {
      return await fetchNestApiFromServer<BusinessCardStats>(
        `/business-cards/leads/stats?days=${days || 30}`,
        token,
      );
    } catch {
      return {
        totalLeads: 0,
        totalInteractions: 0,
        uniqueViews: 0,
        respondedLeads: 0,
        responseRate: 0,
        daily: [],
        statusBreakdown: [],
        rangeDays: days || 30,
      };
    }
  },
};
