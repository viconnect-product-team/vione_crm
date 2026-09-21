// BC-4.1B — Stable TanStack Query keys for Business Meetings.
// Narrow, deterministic keys so consumers can invalidate precisely without
// broad unrelated cache clearing.

export type MeetingListFilters = {
  limit?: number;
  offset?: number;
};

const root = ["business-meetings"] as const;

export const businessMeetingKeys = {
  all: root,
  detail: (meetingId: string) => [...root, "detail", meetingId] as const,
  proposals: (meetingId: string) => [...root, "proposals", meetingId] as const,
  upcoming: (filters?: MeetingListFilters) => [...root, "list", "upcoming", filters ?? {}] as const,
  pending: (filters?: MeetingListFilters) => [...root, "list", "pending", filters ?? {}] as const,
  past: (filters?: MeetingListFilters) => [...root, "list", "past", filters ?? {}] as const,
  cancelled: (filters?: MeetingListFilters) =>
    [...root, "list", "cancelled", filters ?? {}] as const,
  counts: () => [...root, "counts"] as const,
} as const;
