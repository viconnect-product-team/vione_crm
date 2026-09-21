import { MEMBERS, type Member } from "./members-data";
import { CURRENT_USER_ID } from "./networking-data";

export type OpportunityTypeKey =
  | "opp.type.partnership"
  | "opp.type.investment"
  | "opp.type.supply"
  | "opp.type.demand"
  | "opp.type.distribution"
  | "opp.type.other";

export type OpportunityStatus = "open" | "closed";

export type Opportunity = {
  id: string;
  posterId: string;
  posterName?: string;
  posterAvatar?: string;
  title: string;
  description: string;
  type: OpportunityTypeKey;
  budgetMin?: number;
  budgetMax?: number;
  region: string;
  industry: string;
  deadline: string; // ISO date
  status: OpportunityStatus;
  createdAt: string;
  views: number;
  emoji: string;
  contactName?: string;
  contactPhone?: string;
  contactTitle?: string;
  company?: string;
  image?: string;
  claimedById?: string;
  claimedByName?: string;
  claimedAt?: string;
  claimedPhone?: string;
  claimedCompany?: string;
};

export type OpportunityInterest = {
  id: string;
  opportunityId: string;
  memberId: string;
  message: string;
  contact: string;
  createdAt: string;
};

export const OPPORTUNITY_TYPES: OpportunityTypeKey[] = [
  "opp.type.partnership",
  "opp.type.investment",
  "opp.type.supply",
  "opp.type.demand",
  "opp.type.distribution",
  "opp.type.other",
];

export function getPoster(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}

export const ICON_OPTIONS = [
  "💡",
  "🚀",
  "🌱",
  "⚙️",
  "🌍",
  "🏙️",
  "🤝",
  "📈",
  "💼",
  "🏭",
  "🛒",
  "✈️",
];
