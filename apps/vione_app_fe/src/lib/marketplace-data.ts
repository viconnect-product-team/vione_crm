import { MEMBERS, type Member } from "./members-data";

export type ProductCategoryKey =
  | "mk.cat.service"
  | "mk.cat.product"
  | "mk.cat.tech"
  | "mk.cat.consult"
  | "mk.cat.realestate"
  | "mk.cat.other";

export type ProductStatus = "active" | "sold" | "draft";

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number; // VND
  originalPrice?: number;
  memberPrice?: number;
  unit?: string;
  company?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerAvatar?: string;
  category: ProductCategoryKey;
  status: ProductStatus;
  createdAt: string;
  views: number;
  emoji: string;
  pdfUrl?: string;
  imageUrls?: string[];
  websiteUrl?: string;
  facebookUrl?: string;
};

export type QuoteStatus = "sent" | "viewing" | "confirmed" | "rejected" | "cancelled";

export type QuoteRequest = {
  id: string;
  productId: string;
  buyerId: string;
  quantity: number;
  message: string;
  contact: string;
  status: QuoteStatus;
  reminderCount: number;
  cancelReason: string;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORIES: ProductCategoryKey[] = [
  "mk.cat.service",
  "mk.cat.product",
  "mk.cat.tech",
  "mk.cat.consult",
  "mk.cat.realestate",
  "mk.cat.other",
];

export function getSeller(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
