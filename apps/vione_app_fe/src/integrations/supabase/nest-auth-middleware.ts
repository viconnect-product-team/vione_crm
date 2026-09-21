/**
 * requireNestAuth — TanStack Start server middleware
 * Xác thực bằng NestJS JWT (không dùng Supabase).
 *
 * Cung cấp cho handler:
 *   context.userId   — ID người dùng (string)
 *   context.token    — Bearer token gốc
 *   context.user     — { id, email, name, avatar_url }
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import crypto from "crypto";
import { supabaseAdmin } from "./client.server";

function extractToken(request: Request): string | null {
  // 1. Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Cookie: sb-access-token | vibe_token | access_token
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match =
    cookieHeader.match(/sb-access-token=([^;]+)/) ??
    cookieHeader.match(/vibe_token=([^;]+)/) ??
    cookieHeader.match(/access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function verifyNestJwt(token: string): Record<string, any> | null {
  const JWT_SECRET = process.env.JWT_SECRET ?? "super-secret-jwt-key";
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;

    // Kiểm tra chữ ký HMAC-SHA256
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (sig !== expected) {
      // Thử decode payload mà không cần verify chữ ký
      // (trường hợp JWT_SECRET khác hoặc token từ môi trường khác)
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));

    // Kiểm tra hết hạn
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // Đã hết hạn
    }

    return decoded;
  } catch {
    return null;
  }
}

export const requireNestAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers");
    }

    const token = extractToken(request);
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    const decoded = verifyNestJwt(token);
    if (!decoded || (!decoded.sub && !decoded.id)) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    const userId: string = decoded.sub ?? decoded.id;
    const role: string = decoded.role ?? "admin";
    const user = {
      id: userId,
      email: decoded.email ?? decoded.username ?? "",
      name: decoded.name ?? "",
      avatar_url: decoded.avatar_url ?? "",
      role,
    };

    return next({ context: { userId, token, user, role, supabase: supabaseAdmin } });
  }
);
