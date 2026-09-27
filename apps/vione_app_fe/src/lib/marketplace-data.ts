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

export function isUserProductOwner(product: Product | null | undefined, user: any, member?: any): boolean {
  if (!product) return false;

  const userIds: string[] = [];
  if (user?.id) userIds.push(String(user.id).trim().toLowerCase());
  if (user?.sub) userIds.push(String(user.sub).trim().toLowerCase());
  if (user?.memberId) userIds.push(String(user.memberId).trim().toLowerCase());
  if (user?.member_id) userIds.push(String(user.member_id).trim().toLowerCase());
  if (member?.id) userIds.push(String(member.id).trim().toLowerCase());
  if (member?.userId) userIds.push(String(member.userId).trim().toLowerCase());
  if (member?.code) userIds.push(String(member.code).trim().toLowerCase());

  if (typeof window !== "undefined") {
    try {
      const storedMemberId = localStorage.getItem("vibe_member_id");
      if (storedMemberId) userIds.push(storedMemberId.trim().toLowerCase());
      const rawUser = localStorage.getItem("vibe_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.id) userIds.push(String(u.id).trim().toLowerCase());
        if (u.memberId) userIds.push(String(u.memberId).trim().toLowerCase());
        if (u.member_id) userIds.push(String(u.member_id).trim().toLowerCase());
      }
    } catch {}
  }

  // 1. Check sellerId
  const prodSellerId = String(product.sellerId || (product as any).seller_id || (product as any).userId || (product as any).memberId || "").trim().toLowerCase();
  if (prodSellerId && userIds.length > 0 && userIds.includes(prodSellerId)) {
    return true;
  }

  // 2. Check seller phone number
  const userPhone = String(user?.phone || member?.phone || "").replace(/\D/g, "");
  const prodPhone = String(product.sellerPhone || (product as any).seller_phone || (product as any).phone || "").replace(/\D/g, "");
  if (userPhone && prodPhone && userPhone.length >= 9 && userPhone === prodPhone) {
    return true;
  }

  // 3. Check seller full name
  const userName = String(user?.name || user?.user_metadata?.full_name || member?.name || member?.fullName || "").trim().toLowerCase();
  const prodName = String(product.sellerName || (product as any).seller_name || "").trim().toLowerCase();
  if (userName && prodName && userName.length >= 3 && userName === prodName) {
    return true;
  }

  // 4. Check company
  const userCompany = String(user?.company || member?.company || member?.title || "").trim().toLowerCase();
  const prodCompany = String(product.company || "").trim().toLowerCase();
  if (userCompany && prodCompany && userCompany.length >= 4 && userCompany === prodCompany) {
    return true;
  }

  return false;
}

export const checkIsProductAuthor = isUserProductOwner;

