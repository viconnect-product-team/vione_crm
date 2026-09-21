// Shared constants for the /voting route search params. Kept outside the route
// file so both the split shared chunk (validateSearch) and the component chunk
// can import them.
import type { Vote } from "@/lib/voting.functions";

export type VoteFilter = "all" | Vote["status"];
export const VOTE_FILTERS: VoteFilter[] = ["all", "scheduled", "open", "closed"];
export const VOTE_PAGE_SIZES = [10, 20, 50];
