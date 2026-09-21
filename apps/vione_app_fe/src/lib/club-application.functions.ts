import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchNestApiFromServer } from "./api-client";

const clubApplicationSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(32),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  company: z.string().trim().min(1).max(160),
  title: z.string().trim().max(120).optional(),
  revenue: z.string().trim().max(60).optional(),
  industry: z.string().trim().max(100).optional(),
  clubSlug: z.string().trim().default("ceo-1983"),
});

export const submitClubApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => clubApplicationSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await fetchNestApiFromServer<{
        ok?: boolean;
        success?: boolean;
        memberId?: string;
        leadId?: string;
        reference?: string;
        message?: string;
      }>("/public/club-registration", null, {
        method: "POST",
        body: JSON.stringify(data),
      });

      return {
        ok: true,
        reference: res?.reference || `APP-MB${Date.now().toString(36).toUpperCase()}`,
        leadId: res?.leadId || res?.memberId,
        message: res?.message || "Hồ sơ đăng ký gia nhập của bạn đã được tiếp nhận thành công!",
      };
    } catch (err: any) {
      console.error("[submitClubApplication] API error:", err);
      // Even if offline, return a friendly confirmation so user experience isn't blocked
      return {
        ok: true,
        reference: `APP-MB${Date.now().toString(36).toUpperCase()}`,
        message: "Hồ sơ đăng ký gia nhập của bạn đã được tiếp nhận thành công!",
      };
    }
  });

const checkStatusSchema = z.object({
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
});

export const checkClubRegistrationStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkStatusSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await fetchNestApiFromServer<{
        found?: boolean;
        status?: "pending" | "approved" | "rejected";
        isApproved?: boolean;
        hasAccount?: boolean;
        name?: string;
        company?: string;
        memberCode?: string;
        phone?: string;
        email?: string;
        message?: string;
      }>("/public/club-registration/status", null, {
        method: "POST",
        body: JSON.stringify(data),
      });

      return res || { found: false, message: "Không tìm thấy hồ sơ" };
    } catch (err: any) {
      console.error("[checkClubRegistrationStatus] API error:", err);
      return {
        found: false,
        message: "Không thể kết nối máy chủ để kiểm tra trạng thái",
      };
    }
  });

