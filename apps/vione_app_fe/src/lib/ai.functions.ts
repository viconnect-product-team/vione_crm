import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import { safeRandomUUID } from "@/lib/utils";
import { detectCapability } from "@/lib/ai-capability-router";
import { getAllowedRoutes } from "@/lib/ai-context-builder";
import { AiProviderError, mockAiProvider, type AiProviderOutput } from "@/lib/ai-provider";
import type { PermissionLevel } from "@/lib/ai-context-providers";

/**
 * AI Association Assistant — read-only server function.
 *
 * Security posture:
 * - Authenticated only (requireNestAuth). Anonymous callers are rejected.
 * - READ-ONLY: this function never writes to the database directly.
 * - The model is instructed to answer from provided context only and to never
 *   fabricate metrics, citations, or data the user cannot access.
 */

type ChatRole = "user" | "assistant";

export type AiChatMessage = {
  role: ChatRole;
  content: string;
};

type AiChatInput = {
  messages: AiChatMessage[];
};

const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;

const SYSTEM_PROMPT = `Bạn là Trợ lý AI của nền tảng quản trị Hiệp hội (Association Hub).
Nguyên tắc bắt buộc:
- Chỉ trả lời dựa trên dữ liệu và ngữ cảnh được cung cấp. TUYỆT ĐỐI không bịa số liệu, tên hội viên, số tiền hội phí, hay nguồn tham chiếu.
- Nếu chưa có dữ liệu thực để trả lời, hãy nói rõ giới hạn: bạn đang ở chế độ chỉ đọc và chưa được kết nối trực tiếp với dữ liệu hiệp hội trong phiên này.
- Không tiết lộ thông tin nhạy cảm hoặc dữ liệu vượt quá quyền của người dùng.
- Trả lời ngắn gọn, chuyên nghiệp, bằng tiếng Việt (trừ khi người dùng dùng ngôn ngữ khác).
- Khi được yêu cầu soạn thảo (thông báo, email), hãy soạn nội dung nhưng nhắc người dùng kiểm tra trước khi gửi.`;

function sanitize(messages: unknown): AiChatMessage[] {
  if (!Array.isArray(messages)) {
    throw new Error("Định dạng tin nhắn không hợp lệ.");
  }
  const cleaned: AiChatMessage[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const trimmed = content.trim().slice(0, MAX_CHARS);
    if (!trimmed) continue;
    cleaned.push({ role, content: trimmed });
  }
  if (cleaned.length === 0) {
    throw new Error("Không có nội dung hợp lệ để gửi.");
  }
  return cleaned;
}

/** Lấy roles của user từ NestJS /api/ai/roles */
async function fetchUserRoles(token: string): Promise<{
  globalRoles: string[];
  associationId: string | null;
  membershipRoles: string[];
}> {
  try {
    return await fetchNestApiFromServer("/ai/roles", token) as any;
  } catch {
    return { globalRoles: [], associationId: null, membershipRoles: [] };
  }
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: AiChatInput) => ({ messages: sanitize(data?.messages) }))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Trợ lý AI chưa được cấu hình. Thiếu LOVABLE_API_KEY.");
    }

    // Resolve association + roles SERVER-SIDE qua NestJS
    const { globalRoles, associationId, membershipRoles } = await fetchUserRoles(context.token);
    const roleSet = new Set<string>([...globalRoles, ...membershipRoles]);

    const isPlatformAdmin = roleSet.has("platform_admin");
    const isAdmin = isPlatformAdmin || roleSet.has("admin");
    const isModerator = isAdmin || roleSet.has("moderator");
    const canAccessAdminData = isAdmin || isModerator;

    const allowedScopes = [
      "tài liệu (theo quyền xem)",
      "danh bạ hội viên (trường công khai)",
      "sự kiện",
      "marketplace",
      "thông báo",
      ...(canAccessAdminData
        ? ["hội phí / tài chính", "báo cáo lãnh đạo", "quản trị hội viên"]
        : []),
    ];
    const deniedNote = canAccessAdminData
      ? "Người dùng có quyền quản trị."
      : "Người dùng KHÔNG có quyền quản trị: TUYỆT ĐỐI không tiết lộ hội phí, số liệu tài chính, báo cáo lãnh đạo hay dữ liệu quản trị. Nếu được hỏi, hãy từ chối và giải thích rằng cần quyền quản trị.";

    const scopePrompt = `Bối cảnh phân quyền:
- Người dùng thuộc hiệp hội có mã ${associationId ?? "unknown"}. Chỉ trả lời trong phạm vi hiệp hội này.
- Vai trò: ${[...roleSet].join(", ") || "member"}.
- Nguồn dữ liệu được phép: ${allowedScopes.join("; ")}.
- ${deniedNote}
- Mọi dữ liệu đều bị giới hạn bởi Row Level Security; không suy đoán dữ liệu ngoài quyền của người dùng.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: scopePrompt },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("Đã đạt giới hạn yêu cầu. Vui lòng thử lại sau ít phút.");
    if (res.status === 402) throw new Error("Cần nạp thêm tín dụng AI để tiếp tục.");
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("AI gateway error:", res.status, detail);
      throw new Error("Trợ lý AI tạm thời không phản hồi. Vui lòng thử lại.");
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Trợ lý AI không trả về nội dung.");

    // Audit log qua NestJS (fire-and-forget, không làm hỏng response)
    fetchNestApiFromServer("/ai/audit", context.token, {
      method: "POST",
      body: JSON.stringify({
        requestId: safeRandomUUID(),
        associationId,
        capability: "chat",
        permissionLevel: isPlatformAdmin ? "platform" : isAdmin ? "admin" : "member",
        provider: "lovable",
        model: "gemini-3-flash-preview",
        usedFallback: false,
        action: "Truy vấn Trợ lý AI",
        target: `${data.messages.length} tin nhắn · mô hình gemini-3-flash`,
        sourceTypes: [],
        sourceCount: 0,
      }),
    }).catch((e) => console.error("AI audit log failed:", e));

    return { reply };
  });

/**
 * askAssociationAiFn — Production-safe AI gateway (guarded).
 * Roles, permission level, association id — tất cả resolve server-side qua NestJS.
 */
type AskAiInput = {
  message: string;
  selectedContextSources?: string[];
  mode?: string;
  conversationId?: string;
  clientMemorySummary?: string;
};

const MAX_SUMMARY_CHARS = 1000;

function validateAskInput(data: AskAiInput) {
  const message = typeof data?.message === "string" ? data.message.trim().slice(0, MAX_CHARS) : "";
  if (!message) throw new Error("Vui lòng nhập nội dung câu hỏi.");
  const selectedContextSources = Array.isArray(data?.selectedContextSources)
    ? data.selectedContextSources.filter((s) => typeof s === "string").slice(0, 12)
    : undefined;
  const clientMemorySummary =
    typeof data?.clientMemorySummary === "string"
      ? data.clientMemorySummary.trim().slice(0, MAX_SUMMARY_CHARS)
      : undefined;
  return {
    message,
    selectedContextSources,
    mode: typeof data?.mode === "string" ? data.mode.slice(0, 40) : undefined,
    conversationId:
      typeof data?.conversationId === "string" ? data.conversationId.slice(0, 100) : undefined,
    clientMemorySummary,
  };
}

export const askAssociationAiFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: AskAiInput) => validateAskInput(data))
  .handler(async ({ data, context }) => {
    const startedAt = Date.now();
    const requestId = safeRandomUUID();

    // 1) Resolve association + role SERVER-SIDE qua NestJS
    const { globalRoles, associationId, membershipRoles } = await fetchUserRoles(context.token);
    const roleSet = new Set<string>([...globalRoles, ...membershipRoles]);

    const permissionLevel: PermissionLevel = roleSet.has("platform_admin")
      ? "platform"
      : roleSet.has("admin")
        ? "admin"
        : roleSet.has("moderator")
          ? "moderator"
          : "member";

    // 2) Rate limit (per user + per association, best-effort in-memory)
    const { checkAiRateLimit } = await import("@/lib/ai-rate-limit");
    const rl = checkAiRateLimit({ userId: context.userId, associationId: associationId ?? "", role: permissionLevel });
    if (!rl.allowed) {
      throw new Error(rl.message ?? "Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau.");
    }

    // 3) Capability detection + context
    const detection = detectCapability(data.message);
    const capability = detection.capability;
    const allowedRoutes = getAllowedRoutes();

    const { buildServerContext } = await import("@/lib/ai-server-context");
    const { readAiConfig, selectAiProvider } = await import("@/lib/ai-provider.server");
    const config = readAiConfig();

    // Runtime override: đọc AI provider config từ NestJS
    try {
      const setting = await fetchNestApiFromServer("/ai/settings/provider", context.token) as { mode: string | null };
      const mode = setting?.mode;
      if (mode === "real") {
        if (config.provider === "mock") config.provider = "openai";
        config.realEnabled = true;
      } else if (mode === "mock") {
        config.realEnabled = false;
      }
    } catch (e) {
      console.error("AI provider override read failed, using env config:", (e as Error)?.message);
    }

    // buildServerContext không dùng Supabase — truyền null an toàn
    const bundle = await buildServerContext({
      supabase: null as any,
      message: data.message,
      capability,
      associationId: associationId ?? "",
      permissionLevel,
      maxContextItems: config.maxContextItems,
    });

    // 4) Generate với retry 1 lần khi lỗi tạm thời
    const provider = selectAiProvider(config);
    const genArgs = {
      message: data.message,
      capability,
      permissionLevel,
      bundle,
      memorySummary: data.clientMemorySummary,
      allowedRoutes,
    };
    const TRANSIENT = new Set(["timeout", "rate_limited", "unavailable"]);
    const isTransient = (e: unknown) => e instanceof AiProviderError && TRANSIENT.has(e.code);

    let out: AiProviderOutput;
    const providerStartedAt = Date.now();
    let providerFailure: { code: string; retryable: boolean; message: string } | null = null;
    try {
      try {
        out = await provider.generate(genArgs);
      } catch (e1) {
        if (isTransient(e1) && provider !== mockAiProvider) {
          await new Promise((r) => setTimeout(r, 500));
          console.warn("AI provider transient failure, retrying once:", (e1 as AiProviderError).code);
          out = await provider.generate(genArgs);
        } else {
          throw e1;
        }
      }
    } catch (e) {
      const code = e instanceof AiProviderError ? e.code : "error";
      const retryable = TRANSIENT.has(code);
      providerFailure = { code, retryable, message: (e as Error)?.message ?? "AI provider failed" };
      console.error("AI provider failed (no fallback):", code, providerFailure.message);
    }
    const providerLatencyMs = Date.now() - providerStartedAt;

    if (!providerFailure && provider === mockAiProvider) {
      console.warn("[MOCK-MODE] AI answer served from mock provider", { requestId, capability, realEnabled: config.realEnabled });
    }

    // 4b) Audit failure + throw structured error
    if (providerFailure) {
      const duration = Date.now() - startedAt;
      fetchNestApiFromServer("/ai/audit", context.token, {
        method: "POST",
        body: JSON.stringify({
          requestId,
          associationId,
          capability,
          permissionLevel,
          provider: provider === mockAiProvider ? "mock" : "real",
          model: null,
          usedFallback: false,
          fallbackReason: providerFailure.code,
          providerLatencyMs,
          totalLatencyMs: duration,
          sourceTypes: [...new Set(bundle.sources.map((s) => s.type))],
          sourceCount: bundle.sources.length,
        }),
      }).catch((e) => console.error("AI failure audit insert failed:", (e as Error)?.message));

      throw new Error(
        `AI_ERROR:${providerFailure.code}:${providerFailure.retryable ? "1" : "0"}:${providerFailure.message}`,
      );
    }

    // 5) Guard output
    const { guardProviderOutput } = await import("@/lib/ai-output-guard");
    const guarded = guardProviderOutput(out!, {
      allowedSourceIds: bundle.sources.map((s) => s.id),
      allowedRoutes,
    });
    const safe = guarded.output;
    const evidence = safe.evidenceIds
      .map((id: any) => bundle.sources.find((s) => s.id === id))
      .filter((s): s is (typeof bundle.sources)[number] => Boolean(s));

    const duration = Date.now() - startedAt;
    const model = out!.model ?? out!.providerName;
    const sourceTypes = [...new Set(bundle.sources.map((s) => s.type))];

    // 6) Audit log — metadata only, qua NestJS
    fetchNestApiFromServer("/ai/audit", context.token, {
      method: "POST",
      body: JSON.stringify({
        requestId,
        associationId,
        capability,
        permissionLevel,
        provider: provider === mockAiProvider ? "mock" : out!.providerName,
        model,
        usedFallback: false,
        fallbackReason: null,
        providerLatencyMs,
        totalLatencyMs: duration,
        sourceTypes,
        sourceCount: bundle.sources.length,
        action: "Trợ lý AI (gateway)",
        target: `req ${requestId} · ${capability} · ${model} · ${duration}ms (LLM ${providerLatencyMs}ms) · sources ${sourceTypes.join("/") || "none"}`,
      }),
    }).catch((e) => console.error("AI audit log failed:", e));

    return {
      answer: safe.answer,
      reasoningSummary: safe.reasoningSummary,
      evidence,
      limitations: safe.limitations,
      suggestedActions: safe.suggestedActions,
      confidence: safe.confidence,
      clarificationQuestion: safe.clarificationQuestion,
      model,
      requestId,
      usedFallback: false,
      fallbackReason: null,
    };
  });
