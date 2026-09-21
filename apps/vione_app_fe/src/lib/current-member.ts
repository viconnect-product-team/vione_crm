/**
 * current-member.ts
 * Resolve thông tin member của user hiện tại qua NestJS API.
 * Không dùng Supabase.
 */
import { fetchNestApiFromServer } from "./api-client";

/**
 * Resolve member ID của user hiện tại (server-side).
 * Gọi GET /api/members/me — NestJS trả về member record của user đang login.
 * Throws nếu user chưa có member profile.
 */
export async function resolveMemberId(token: string | any): Promise<string> {
  const data = await fetchNestApiFromServer("/members/me", token) as any;
  if (!data?.id) throw new Error("Tài khoản chưa được liên kết hồ sơ hội viên.");
  return data.id as string;
}

/**
 * Giống resolveMemberId nhưng trả null thay vì throw khi chưa có member profile.
 */
export async function resolveMemberIdOrNull(token: string | any): Promise<string | null> {
  try {
    const data = await fetchNestApiFromServer("/members/me", token) as any;
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve association ID hiện tại của user (server-side).
 * Gọi GET /api/members/me và lấy association_id.
 */
export async function resolveAssociationId(token: string | any): Promise<string> {
  const data = await fetchNestApiFromServer("/members/me", token) as any;
  const assocId = data?.association_id ?? data?.associationId ?? null;
  if (!assocId) throw new Error("Tài khoản chưa thuộc hiệp hội nào.");
  return assocId as string;
}
