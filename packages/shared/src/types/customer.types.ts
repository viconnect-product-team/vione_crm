import { DealStage } from "../enums/status.enum.js";

export interface SharedCustomerLead {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  title?: string;
  phone: string;
  email?: string;
  dealSize?: number;
  stage: DealStage;
  health: "hot" | "stable" | "needs_attention";
  source: "nfc_tap" | "card_scan" | "b2b_network" | "website_lead" | "referral";
  tags?: string[];
  nextFollowUp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedCustomerTimeline {
  id: string;
  customerId: string;
  userId: string;
  type: "call" | "meeting" | "quote" | "message" | "stage_change" | "note";
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
