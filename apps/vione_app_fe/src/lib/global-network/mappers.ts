// BC-3.1B — Direction-aware DTO mappers.
// Convert participant-safe domain connections into JSON-safe DTOs relative to
// the trusted current user. Never exposes internal pair/block fields.

import type { GlobalConnection, GlobalConnectionDTO } from "./types";

/** Map a domain connection to a direction-aware DTO for the given viewer. */
export function toConnectionDTO(
  conn: GlobalConnection,
  currentUserId: string,
): GlobalConnectionDTO {
  const requestedByCurrentUser = conn.requesterUserId === currentUserId;
  const direction: "incoming" | "outgoing" = requestedByCurrentUser ? "outgoing" : "incoming";
  const counterpartUserId = requestedByCurrentUser ? conn.recipientUserId : conn.requesterUserId;

  return {
    id: conn.id,
    requesterUserId: conn.requesterUserId,
    recipientUserId: conn.recipientUserId,
    status: conn.status,
    sourceType: conn.sourceType,
    sourceId: conn.sourceId,
    requestedAt: conn.requestedAt,
    respondedAt: conn.respondedAt,
    disconnectedAt: conn.disconnectedAt,
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt,
    direction,
    counterpartUserId,
    requestedByCurrentUser,
  };
}

export function toConnectionDTOs(
  conns: GlobalConnection[],
  currentUserId: string,
): GlobalConnectionDTO[] {
  return conns.map((c: any) => toConnectionDTO(c, currentUserId));
}
