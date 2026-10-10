import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  ShieldCheck,
  Info,
  Lock,
  Loader2,
  Lightbulb,
  FileSearch,
  ArrowRight,
  Layers,
  History,
  X,
  RefreshCw,
  HelpCircle,
  Database,
  ListChecks,
  Wand2,
  ShieldAlert,
  Workflow,
  CircleCheck,
  CircleDashed,
  CircleAlert,
  Clock,
  Play,
  FileSpreadsheet,
  UploadCloud,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Download,
  Eye,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { safeRandomUUID } from "@/lib/utils";
import { fetchNestApi } from "@/lib/api-client";
import { AppShell } from "@/components/dashboard/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/use-role";
import {
  CAPABILITIES,
  DEFAULT_CAPABILITY_ID,
  canUseCapability,
  getCapability,
  getCapabilityMemory,
  userRoleRank,
  type CapabilityId,
  type CapabilityLink,
} from "@/lib/ai-capabilities";
import {
  clearMemory,
  hasContext,
  loadMemory,
  saveMemory,
  type AiSessionMemory,
} from "@/lib/ai-session-memory";
import { resolveFollowUpContext } from "@/lib/ai-context-resolver";
import {
  detectCapability,
  toRegistryCapability,
  fromRegistryCapability,
} from "@/lib/ai-capability-router";

import type { ContextSource, SuggestedAction } from "@/lib/ai-context-providers";
import {
  planActions,
  canExecuteTool,
  type ActionPlan,
  type AiTool,
  type ToolAvailability,
} from "@/lib/ai-tools";
import {
  getWorkflow,
  initWorkflowRun,
  advanceRun,
  confirmStep,
  skipStep,
  retryStep,
  cancelRun,
  totalEstimatedDuration,
  type WorkflowRun,
  type RunStep,
  type StepStatus,
} from "@/lib/ai-workflows";
import { planWorkflow, type WorkflowPlan } from "@/lib/ai-workflow-planner";
import { askAssociationAiFn } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Trợ lý AI Copilot 5.0 — Hệ Điều Hành Doanh Nghiệp ViOne" },
      {
        name: "description",
        content:
          "Trợ lý AI điều hành doanh nghiệp ViOne Platform 5.0 — Tự động soạn thảo văn bản, nhập liệu Excel thông minh, báo cáo realtime, điều phối vận hành đa phân hệ.",
      },
    ],
  }),
  component: AiAssistantPage,
});

type StructuredAnswer = {
  capabilityId: CapabilityId;
  answer: string;
  reasoning: string;
  evidence: ContextSource[];
  limitations: string[];
  actions: SuggestedAction[];
  relatedModules: CapabilityLink[];
  permissionDenied?: boolean;
  clarificationQuestion?: string;
  plan?: ActionPlan;
  toolCards?: Array<{ tool: AiTool; availability: ToolAvailability }>;
  workflow?: WorkflowPlan;
  fallbackNotice?: string;
  /** Which engine produced this answer, for QA/acceptance visibility. */
  providerStatus?: "real" | "fallback" | "mock";
  /** Model/engine label reported by the server gateway. */
  model?: string;
  document?: {
    id?: string;
    code: string;
    name: string;
    category: string;
    description?: string;
    content?: string;
  };
  excelReport?: {
    id: string;
    filename: string;
    downloadUrl: string;
    fileSize: string;
    category: string;
    rowCount: number;
    title?: string;
  };
  generatedFiles?: Array<{
    id: string;
    filename: string;
    downloadUrl: string;
    fileSize: string;
    fileType: "excel" | "word" | "pdf";
    title?: string;
    recordCount?: number;
  }>;
  voiceText?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  structured?: StructuredAnswer;
  /** Original user prompt, so a degraded answer can be retried. */
  retryText?: string;
};

const GUARDRAILS = [
  "AI chỉ trả lời dựa trên dữ liệu bạn có quyền truy cập.",
  "Không hiển thị dữ liệu nhạy cảm nếu không được phân quyền.",
  "Nếu không có dữ liệu, AI sẽ nói rõ thay vì suy đoán.",
  "Kết quả AI cần được kiểm tra trước khi sử dụng chính thức.",
];

export type AiChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  capabilityId: CapabilityId;
};

function AiAssistantPage() {
  const { user, status } = useAuth();
  const { isAdmin, isModerator, isQuanTri, currentUser, loading: roleLoading } = useRole();
  const [sessions, setSessions] = useState<AiChatSession[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vione_ai_chat_sessions");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => safeRandomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCapability, setActiveCapability] = useState<CapabilityId>(DEFAULT_CAPABILITY_ID);
  const [memory, setMemory] = useState<AiSessionMemory>(() => loadMemory());
  const [usingContext, setUsingContext] = useState(false);
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowRun[]>([]);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastCapabilityRef = useRef<CapabilityId | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Lưu và đồng bộ phiên trò chuyện hiện tại vào localStorage
  useEffect(() => {
    if (messages.length === 0) return;
    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? "..." : "")
        : "Cuộc trò chuyện";

      let updated: AiChatSession[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          title: updated[existingIdx].title || title,
          updatedAt: new Date().toISOString(),
          messages,
          capabilityId: activeCapability,
        };
      } else {
        const newSession: AiChatSession = {
          id: currentSessionId,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages,
          capabilityId: activeCapability,
        };
        updated = [newSession, ...prev];
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vione_ai_chat_sessions", JSON.stringify(updated.slice(0, 30)));
        } catch {}
      }
      return updated;
    });
  }, [messages, currentSessionId, activeCapability]);

  const rank = useMemo(() => userRoleRank({ isAdmin, isModerator }), [isAdmin, isModerator]);
  const enabledCapabilities = useMemo(
    () => CAPABILITIES.filter((c) => canUseCapability(c, rank)),
    [rank],
  );
  const activeCap = getCapability(activeCapability);

  // Hydrate session memory on the client (SSR safe).
  useEffect(() => {
    const mem = loadMemory();
    setMemory(mem);
    if (mem.activeCapability) {
      setActiveCapability(mem.activeCapability);
      lastCapabilityRef.current = mem.lastCapability ?? mem.activeCapability;
    }
    inputRef.current?.focus();
  }, []);

  // Safety: clear AI session memory when the association changes or on sign-out.
  useEffect(() => {
    const reset = () => {
      const fresh = clearMemory();
      setMemory(fresh);
      setMessages([]);
      setUsingContext(false);
      setActiveCapability(DEFAULT_CAPABILITY_ID);
      lastCapabilityRef.current = null;
    };
    window.addEventListener("association-changed", reset);
    window.addEventListener("auth-changed", reset);
    return () => {
      window.removeEventListener("association-changed", reset);
      window.removeEventListener("auth-changed", reset);
    };
  }, []);

  useEffect(() => {
    if (status === "out") {
      const fresh = clearMemory();
      setMemory(fresh);
      setMessages([]);
      setUsingContext(false);
    }
  }, [status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const clearContext = useCallback(() => {
    setMemory((prev) =>
      saveMemory({
        ...prev,
        activeCapability: prev.activeCapability,
        selectedContextSources: [],
        recentEntities: [],
        recentResults: [],
        recentSources: [],
        activeFilters: [],
        suggestedActions: [],
        lastUserIntent: null,
        lastAssistantSummary: null,
      }),
    );
    setUsingContext(false);
    toast.success("Đã xóa ngữ cảnh hiện tại");
  }, []);

  const startNewTopic = useCallback(() => {
    const newId = safeRandomUUID();
    setCurrentSessionId(newId);
    const fresh = clearMemory();
    setMemory(fresh);
    setMessages([]);
    setUsingContext(false);
    setActiveCapability(DEFAULT_CAPABILITY_ID);
    lastCapabilityRef.current = null;
    setInput("");
    inputRef.current?.focus();
    toast.success("Đã tạo cuộc trò chuyện mới");
  }, []);

  const selectSession = useCallback((session: AiChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    if (session.capabilityId) {
      setActiveCapability(session.capabilityId);
    }
    toast.info(`Đã mở cuộc trò chuyện: "${session.title}"`);
  }, []);

  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vione_ai_chat_sessions", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    if (sessionId === currentSessionId) {
      const newId = safeRandomUUID();
      setCurrentSessionId(newId);
      setMessages([]);
      const fresh = clearMemory();
      setMemory(fresh);
      setUsingContext(false);
    }
    toast.success("Đã xóa cuộc trò chuyện khỏi lịch sử");
  }, [currentSessionId]);

  // ---- Workflow orchestration (session-only, human-in-the-loop) ----
  const archiveRun = useCallback((run: WorkflowRun) => {
    setWorkflowHistory((h) => [run, ...h].slice(0, 10));
  }, []);

  const startWorkflow = useCallback(
    (workflowId: string) => {
      const wf = getWorkflow(workflowId);
      if (!wf) return;
      const run = advanceRun(
        initWorkflowRun(wf, { rank, hasAssociation: true }, safeRandomUUID()),
      );
      setActiveRun(run);
      toast.success(`Đã tạo quy trình: ${wf.name}`);
    },
    [rank],
  );

  const confirmRunStep = useCallback(
    (stepId: string) => {
      setActiveRun((run) => {
        if (!run) return run;
        const next = confirmStep(run, stepId);
        if (next.outcome === "completed") {
          archiveRun(next);
          toast.success("Quy trình hoàn tất");
        }
        return next;
      });
    },
    [archiveRun],
  );

  const skipRunStep = useCallback((stepId: string) => {
    setActiveRun((run) => (run ? skipStep(run, stepId) : run));
  }, []);

  const retryRunStep = useCallback((stepId: string) => {
    setActiveRun((run) => (run ? retryStep(run, stepId) : run));
  }, []);

  const cancelActiveRun = useCallback(() => {
    setActiveRun((run) => {
      if (!run) return run;
      const cancelled = cancelRun(run);
      archiveRun(cancelled);
      toast.message("Đã hủy quy trình");
      return null;
    });
  }, [archiveRun]);

  const closeActiveRun = useCallback(() => {
    setActiveRun((run) => {
      if (run && (run.outcome === "completed" || run.outcome === "cancelled")) {
        archiveRun(run);
      }
      return null;
    });
  }, [archiveRun]);

  const clearWorkflowHistory = useCallback(() => setWorkflowHistory([]), []);

  const askAi = useServerFn(askAssociationAiFn);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      // 0) Resolve follow-up context against session memory (deterministic).
      const resolved = resolveFollowUpContext(trimmed, memory);

      // 1) Deterministic capability detection (no LLM) — drives the UI panels.
      // The authoritative answer + evidence come from the server gateway, which
      // re-resolves capability, association, role and context server-side.
      const detection = detectCapability(trimmed, memory);
      const aiCap =
        resolved.isFollowUp && resolved.resolvedCapability
          ? fromRegistryCapability(resolved.resolvedCapability)
          : detection.capability;
      const capId = toRegistryCapability(aiCap);
      const cap = getCapability(capId);
      const allowed = canUseCapability(cap, rank);
      setActiveCapability(capId);
      setUsingContext(resolved.isFollowUp && resolved.confidence >= 0.5);

      const userMsg: ChatMessage = { id: safeRandomUUID(), role: "user", content: trimmed };
      const pendingMsg: ChatMessage = {
        id: safeRandomUUID(),
        role: "assistant",
        content: "",
        pending: true,
        retryText: trimmed,
      };
      setMessages((m) => [...m, userMsg, pendingMsg]);
      setInput("");
      setSending(true);

      const lowConfidence =
        (resolved.isFollowUp && resolved.clarificationNeeded) ||
        (!resolved.isFollowUp && detection.clarificationNeeded);

      // Plan tools + resolve per-tool availability (permission-aware, read-only).
      const plan = planActions(capId, trimmed, { rank, hasAssociation: true });
      const toolCards = plan.tools.map((tool) => ({
        tool,
        availability: canExecuteTool(tool, { rank, hasAssociation: true }),
      }));

      // Orchestration: propose a multi-step workflow (planning only, no run).
      const workflow = planWorkflow(trimmed, capId, memory);

      const finish = (raw: StructuredAnswer) => {
        const structured: StructuredAnswer = { ...raw, plan, toolCards, workflow };
        lastCapabilityRef.current = capId;

        // Update session memory with SAFE metadata only (no raw context/rows).
        setMemory((prev) =>
          saveMemory({
            ...prev,
            lastCapability: prev.activeCapability,
            activeCapability: capId,
            selectedContextSources: allowed ? cap.contextSources : prev.selectedContextSources,
            activeFilters: allowed
              ? [...prev.activeFilters, ...resolved.resolvedFilters]
              : prev.activeFilters,
            recentSources: allowed
              ? [
                  ...prev.recentSources,
                  ...structured.evidence.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    capability: capId,
                  })),
                ]
              : prev.recentSources,
            suggestedActions: allowed
              ? getCapabilityMemory(capId).followUpSuggestions.map((label) => ({ label }))
              : prev.suggestedActions,
            recentMessages: [
              ...prev.recentMessages,
              { role: "user", content: trimmed },
              { role: "assistant", content: structured.answer },
            ],
            lastUserIntent: trimmed,
            lastAssistantSummary: structured.answer,
          }),
        );

        setMessages((m) =>
          m.map((msg) =>
            msg.id === pendingMsg.id
              ? { ...msg, pending: false, content: structured.answer, structured }
              : msg,
          ),
        );
        setSending(false);
        inputRef.current?.focus();
      };

      // 2) Call the server gateway (auth + RLS + mock provider server-side).
      const runGateway = async () => {
        try {
          // Primary: Call live ViOne AI Copilot API directly from NestJS backend
          try {
            const nestRes = await fetchNestApi<any>("/ai/chat", {
              method: "POST",
              body: JSON.stringify({
                message: trimmed,
                selectedContextSources: memory.selectedContextSources,
                clientMemorySummary: memory.lastAssistantSummary?.slice(0, 500) ?? undefined,
                currentUser: currentUser
                  ? {
                      id: currentUser.id,
                      name: currentUser.name,
                      email: currentUser.email,
                      role: currentUser.role,
                      roles: currentUser.roles,
                      companyName: currentUser.companyName,
                      executiveRole: currentUser.executiveRole,
                      isQuanTri,
                      isAdmin,
                    }
                  : {
                      id: user?.id,
                      name: user?.name,
                      email: user?.email,
                      role: user?.role,
                      isQuanTri,
                      isAdmin,
                    },
              }),
            });
            if (nestRes && nestRes.ok && nestRes.answer) {
              finish({
                capabilityId: capId,
                answer: nestRes.answer,
                reasoning: nestRes.reasoningSummary || "Phân tích tự động từ dữ liệu thực tế CRM & ViOne App",
                evidence: (nestRes.evidence || []) as ContextSource[],
                limitations: nestRes.limitations || [],
                actions: (nestRes.suggestedActions || []) as SuggestedAction[],
                relatedModules: cap.relatedModules,
                clarificationQuestion: nestRes.confidence === "low" ? nestRes.clarificationQuestion : undefined,
                providerStatus: "real",
                model: nestRes.model || "ViOne Copilot 5.0 (NestJS Core)",
                plan: nestRes.plan,
                workflow: nestRes.workflow,
                document: nestRes.document,
                excelReport: nestRes.excelReport,
                generatedFiles: nestRes.generatedFiles,
                voiceText: nestRes.voiceText,
              });
              return;
            }
          } catch (backendErr) {
            console.warn("Direct NestJS /ai/chat call failed, falling back to askAi:", backendErr);
          }

          const res = await askAi({
            data: {
              message: trimmed,
              selectedContextSources: memory.selectedContextSources,
              clientMemorySummary: memory.lastAssistantSummary?.slice(0, 500) ?? undefined,
            },
          });
          finish({
            capabilityId: capId,
            answer: res.answer,
            reasoning: res.reasoningSummary,
            evidence: res.evidence as ContextSource[],
            limitations: res.limitations,
            actions: res.suggestedActions as SuggestedAction[],
            relatedModules: cap.relatedModules,
            clarificationQuestion: res.confidence === "low" ? res.clarificationQuestion : undefined,
            providerStatus: res.usedFallback ? "fallback" : "real",
            model: res.model,
            fallbackNotice: res.usedFallback
              ? res.fallbackReason === "rate_limited"
                ? "Mô hình AI đang quá tải, tạm dùng chế độ dự phòng để không gián đoạn."
                : res.fallbackReason === "timeout"
                  ? "Mô hình AI phản hồi chậm, tạm dùng chế độ dự phòng để không gián đoạn."
                  : "Mô hình AI tạm không sẵn sàng, đang dùng chế độ dự phòng."
              : undefined,
          });
        } catch (e) {
          const raw = (e as Error)?.message ?? "";
          console.error("AI gateway call failed:", raw);
          // Server encodes errors as `AI_ERROR:<code>:<retryable 0|1>:<msg>`.
          let code = "error";
          let retryable = false;
          if (raw.startsWith("AI_ERROR:")) {
            const [, c, r] = raw.split(":");
            code = c || "error";
            retryable = r === "1";
          }
          const notice =
            code === "rate_limited"
              ? "Trợ lý AI đang quá tải. Vui lòng thử lại sau vài giây."
              : code === "timeout"
                ? "Trợ lý AI phản hồi quá chậm. Vui lòng thử lại."
                : code === "unavailable"
                  ? "Trợ lý AI tạm thời không khả dụng. Vui lòng thử lại sau ít phút."
                  : "Trợ lý AI gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại hoặc điều chỉnh câu hỏi.";
          toast.error(notice);
          finish({
            capabilityId: capId,
            answer: notice,
            reasoning: "",
            evidence: [],
            limitations: [`Trợ lý AI không trả kết quả (mã: ${code}).`],
            actions: retryable
              ? [{ label: "Thử lại", intent: "new-topic" }]
              : [{ label: "Bắt đầu chủ đề mới", intent: "new-topic" }],
            relatedModules: cap.relatedModules,
            providerStatus: "error" as unknown as "real" | "fallback" | "mock",
            model: "error",
            fallbackNotice: notice,
          });
        }
      };

      void runGateway();
    },
    [sending, rank, memory, askAi],
  );

  const startListening = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error("Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Google Chrome hoặc MS Edge.");
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = "vi-VN";
      rec.continuous = false;
      rec.interimResults = true;
      recognitionRef.current = rec;

      rec.onstart = () => {
        setIsListening(true);
        toast.info("Đang lắng nghe giọng nói tiếng Việt...");
      };

      rec.onresult = (evt: any) => {
        let spoken = "";
        for (let i = evt.resultIndex; i < evt.results.length; ++i) {
          spoken += evt.results[i][0].transcript;
        }
        setInput(spoken);
        if (evt.results[0]?.isFinal && spoken.trim()) {
          setIsListening(false);
          send(spoken.trim());
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
    } catch (err: any) {
      console.error("Speech error:", err);
      setIsListening(false);
    }
  }, [isListening, send]);

  const handleExcelImportSuccess = useCallback(
    (count: number, category: string, filename: string) => {
      const categoryNames: Record<string, string> = {
        companies: "Doanh nghiệp thành viên (public.companies)",
        members: "Danh bạ & Khách hàng (public.members)",
        opportunities: "Cơ hội giao thương B2B (public.business_opportunities)",
        products: "Sản phẩm Marketplace (public.products)",
        tasks: "Công việc & Tiến độ (public.tasks)",
      };
      const targetLabel = categoryNames[category] || category;
      const userMsg: ChatMessage = {
        id: safeRandomUUID(),
        role: "user",
        content: `📁 Đã tải lên và nhập dữ liệu từ tệp: ${filename}`,
      };
      const assistantMsg: ChatMessage = {
        id: safeRandomUUID(),
        role: "assistant",
        content: `📊 **Hoàn tất nhập liệu tự động vào CSDL PostgreSQL!**\n\n- **Tệp nguồn:** \`${filename}\`\n- **Phân hệ tiếp nhận:** **${targetLabel}**\n- **Số dòng hợp lệ đã nạp:** **${count}** bản ghi\n- **Trạng thái:** Dữ liệu đã sẵn sàng trên toàn bộ hệ thống ViOne Platform 5.0.\n\nAnh/chị có thể vào phân hệ tương ứng để tra cứu hoặc yêu cầu em phân tích dữ liệu vừa nhập bất cứ lúc nào!`,
        structured: {
          capabilityId: activeCapability,
          answer: `📊 **Hoàn tất nhập liệu tự động vào CSDL PostgreSQL!**\n\n- **Tệp nguồn:** \`${filename}\`\n- **Phân hệ tiếp nhận:** **${targetLabel}**\n- **Số dòng hợp lệ đã nạp:** **${count}** bản ghi\n- **Trạng thái:** Dữ liệu đã sẵn sàng trên toàn bộ hệ sinh thái ViOne Platform 5.0.`,
          reasoning: `AI Ingestion Processor đọc tệp ${filename}, tự động ánh xạ schema và ghi trực tiếp vào bảng cơ sở dữ liệu.`,
          evidence: [
            { id: "ev-xls-done", type: "document" as any, title: `Đã nạp ${count} bản ghi từ ${filename}`, safeSummary: `Phân hệ ${targetLabel}` }
          ],
          limitations: [],
          actions: [
            { label: "Xem danh sách Doanh nghiệp", route: "/companies" },
            { label: "Xem cơ hội B2B", route: "/opportunities" }
          ],
          relatedModules: [],
          providerStatus: "real",
          model: "ViOne Copilot 5.0 (NestJS Core)",
          voiceText: `Dạ em đã tự động nạp thành công ${count} dòng dữ liệu từ tệp ${filename} vào cơ sở dữ liệu hệ thống. Anh Chị có thể kiểm tra ngay.`,
        },
      };
      setMessages((m) => [...m, userMsg, assistantMsg]);
    },
    [activeCapability],
  );

  const copyAnswer = useCallback(async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId((c) => (c === msg.id ? null : c)), 1500);
    } catch {
      toast.error("Không thể sao chép");
    }
  }, []);

  const retryMessage = useCallback(
    (msg: ChatMessage) => {
      const text = msg.retryText?.trim();
      if (!text || sending) return;
      // Drop the degraded assistant answer and its source user message, then resend.
      setMessages((m) => {
        const idx = m.findIndex((x) => x.id === msg.id);
        if (idx <= 0) return m;
        return m.slice(0, m[idx - 1]?.role === "user" ? idx - 1 : idx);
      });
      send(text);
    },
    [sending, send],
  );

  const hasChat = messages.length > 0;
  const contextActive = hasContext(memory);

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl text-primary-foreground shrink-0"
            style={{ background: "var(--gradient-primary)" }}
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-foreground">Trợ lý AI Copilot 5.0</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                {isQuanTri
                  ? "👑 Quản trị viên tối cao"
                  : isAdmin
                  ? "🛡️ Quản trị viên (Admin)"
                  : `👤 ${currentUser?.executiveRole || currentUser?.role || "Hội viên"}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đang làm việc: <strong className="text-foreground">{currentUser?.name || user?.name || "Tài khoản đăng nhập"}</strong>
              {currentUser?.companyName ? ` (${currentUser.companyName})` : ""} · Trợ lý phản hồi đúng nghiệp vụ &amp; phân quyền
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startNewTopic}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow hover:brightness-105 transition cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ Cuộc chat mới</span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Chat column */}
        <section
          className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
          aria-label="Khu vực trò chuyện với Trợ lý AI"
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
            {!hasChat ? (
              <WelcomePanel onPick={send} capabilities={enabledCapabilities} rank={rank} />
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    copied={copiedId === msg.id}
                    onCopy={() => copyAnswer(msg)}
                    onNewTopic={startNewTopic}
                    onRetry={() => retryMessage(msg)}
                    onStartWorkflow={startWorkflow}
                    activeRunWorkflowId={activeRun?.workflowId ?? null}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-card p-3 sm:p-4">
            {isListening && (
              <div className="mb-2.5 flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-600 dark:text-red-400 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
                  Đang lắng nghe giọng nói... Hãy nói "soạn hợp đồng", "báo cáo doanh thu" hoặc "nhập file excel".
                </div>
                <button
                  type="button"
                  onClick={() => recognitionRef.current?.stop()}
                  className="rounded-lg bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold hover:bg-red-500/30"
                >
                  Dừng
                </button>
              </div>
            )}

            {usingContext && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-[11px] font-medium text-primary">
                <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Đang sử dụng ngữ cảnh từ câu trả lời trước.
              </div>
            )}
            {(contextActive || hasChat) && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {memory.activeFilters.map((f, i) => (
                  <span
                    key={`${f.key}-${f.label}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {f.label}
                  </span>
                ))}
                {contextActive && (
                  <button
                    type="button"
                    onClick={clearContext}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3 w-3" aria-hidden="true" /> Xóa ngữ cảnh
                  </button>
                )}
                {hasChat && (
                  <button
                    type="button"
                    onClick={startNewTopic}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" /> Chủ đề mới
                  </button>
                )}
              </div>
            )}
            {/* Quick document generation templates */}
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Tạo file chuẩn:</span>
              <button
                type="button"
                onClick={() => send("Tạo báo cáo Excel tổng hợp dữ liệu doanh nghiệp và khách hàng mới nhất")}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer"
              >
                <FileSpreadsheet className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Báo cáo Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => send("Soạn thảo văn bản tờ trình kế hoạch hoạt động định dạng Word .docx")}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer"
              >
                <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span>Văn bản Word (.docx)</span>
              </button>
              <button
                type="button"
                onClick={() => send("Xuất tài liệu quy chế làm việc nội bộ định dạng PDF chuẩn format")}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/20 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
              >
                <FileText className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                <span>Tài liệu PDF (.pdf)</span>
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                Năng lực:
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                  <activeCap.icon className="h-3 w-3" aria-hidden="true" />
                  {activeCap.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> CSDL PostgreSQL Realtime
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <button
                type="button"
                onClick={() => setExcelModalOpen(true)}
                title="Nhập dữ liệu thông minh từ Excel (.xlsx, .xls, .csv)"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-emerald-950/30"
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={startListening}
                title={isListening ? "Đang lắng nghe... bấm để dừng" : "Nói với Trợ lý AI (tiếng Việt)"}
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-all ${
                  isListening
                    ? "animate-pulse border-red-500 bg-red-50 text-red-600 shadow-sm dark:bg-red-950/40"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <label htmlFor="ai-input" className="sr-only">
                Nhập câu hỏi cho Trợ lý AI
              </label>
              <textarea
                id="ai-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Hỏi bất cứ điều gì về doanh nghiệp hoặc yêu cầu AI: 'Soạn hợp đồng B2B', 'Báo cáo doanh thu', 'Nhập file Excel'…"
                className="max-h-40 min-h-[48px] flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Gửi câu hỏi"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </form>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Kết quả AI cần được kiểm tra trước khi sử dụng chính thức.
            </p>
          </div>
        </section>

        {/* Dynamic capability panel */}
        <aside
          className="space-y-4 lg:sticky lg:top-4 lg:self-start"
          aria-label="Bảng năng lực và dẫn chứng"
        >
          {/* Lịch sử cuộc trò chuyện & Cuộc chat mới */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <History className="h-4 w-4 text-primary" aria-hidden="true" />
                Lịch sử cuộc chat ({sessions.length})
              </h2>
              <button
                type="button"
                onClick={startNewTopic}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition cursor-pointer"
                title="Bắt đầu cuộc chat mới"
              >
                <Plus className="h-3.5 w-3.5" /> Chat mới
              </button>
            </div>

            {sessions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Chưa có lịch sử trò chuyện. Bắt đầu chat để lưu lại tự động.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isCurrent = s.id === currentSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer ${
                        isCurrent
                          ? "bg-primary/15 text-primary font-bold border border-primary/30"
                          : "bg-muted/40 text-foreground hover:bg-muted font-medium"
                      }`}
                    >
                      <div className="min-w-0 flex-1 truncate pr-2">
                        <div className="truncate">{s.title || "Cuộc trò chuyện"}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {new Date(s.updatedAt || s.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} •{" "}
                          {new Date(s.updatedAt || s.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => deleteSession(s.id, e)}
                        className="rounded-lg p-1 text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                        title="Xóa cuộc chat"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workflow context — active run */}
          {activeRun && (
            <WorkflowRunner
              run={activeRun}
              onConfirm={confirmRunStep}
              onSkip={skipRunStep}
              onRetry={retryRunStep}
              onCancel={cancelActiveRun}
              onClose={closeActiveRun}
            />
          )}

          {/* Workflow history — session only */}
          {workflowHistory.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <History className="h-4 w-4 text-primary" aria-hidden="true" /> Quy trình gần đây
                </h2>
                <button
                  type="button"
                  onClick={clearWorkflowHistory}
                  className="text-[11px] text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Xóa
                </button>
              </div>
              <ul className="space-y-1.5">
                {workflowHistory.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2"
                  >
                    <StepStatusIcon
                      status={
                        h.outcome === "completed"
                          ? "succeeded"
                          : h.outcome === "cancelled"
                            ? "cancelled"
                            : "failed"
                      }
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                      {h.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {h.outcome === "completed"
                        ? "Hoàn tất"
                        : h.outcome === "cancelled"
                          ? "Đã hủy"
                          : "Lỗi"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Lịch sử chỉ tồn tại trong phiên và không được lưu trữ.
              </p>
            </div>
          )}

          {/* Active capability card */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
                aria-hidden="true"
              >
                <activeCap.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">
                  {activeCap.label}
                </h2>
                <p className="truncate text-[11px] text-muted-foreground">
                  {activeCap.description}
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {activeCap.cardFields.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
                >
                  <span className="text-[13px] font-medium text-foreground">{f.label}</span>
                  <span className="text-right text-[11px] text-muted-foreground">{f.hint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Session context panel */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <History className="h-4 w-4 text-primary" aria-hidden="true" /> Ngữ cảnh phiên
              </h2>
              {contextActive && (
                <button
                  type="button"
                  onClick={clearContext}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" /> Xóa
                </button>
              )}
            </div>

            {!contextActive ? (
              <p className="text-[12px] text-muted-foreground">
                Chưa có ngữ cảnh. Ngữ cảnh chỉ tồn tại trong phiên và tự xóa khi bạn đăng xuất hoặc
                đổi hiệp hội.
              </p>
            ) : (
              <div className="space-y-3">
                {memory.activeFilters.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Bộ lọc đang áp dụng
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {memory.activeFilters.map((f, i) => (
                        <span
                          key={`${f.key}-${f.label}-${i}`}
                          className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {memory.recentResults.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Kết quả gần đây
                    </p>
                    <ul className="space-y-0.5">
                      {memory.recentResults.slice(-5).map((r: any) => (
                        <li key={r.id} className="truncate text-[12px] text-foreground">
                          • {r.label}
                          {r.meta ? (
                            <span className="text-muted-foreground"> — {r.meta}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {memory.recentSources.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Database className="h-3 w-3" aria-hidden="true" /> Nguồn gần đây
                    </p>
                    <ul className="space-y-0.5">
                      {memory.recentSources.slice(-5).map((s) => (
                        <li key={s.id} className="truncate text-[12px] text-muted-foreground">
                          • {s.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Gợi ý tiếp theo
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {getCapabilityMemory(activeCapability).followUpSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={startNewTopic}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Bắt đầu chủ đề mới
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Năng lực AI</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Lớp điều phối tự chọn năng lực theo câu hỏi. Bạn cũng có thể chọn thủ công.
            </p>
            <ul className="space-y-1.5">
              {CAPABILITIES.map((cap) => {
                const allowed = canUseCapability(cap, rank);
                const restricted = !allowed && !roleLoading;
                const isActive = cap.id === activeCapability;
                return (
                  <li key={cap.id}>
                    <button
                      type="button"
                      aria-pressed={isActive}
                      disabled={restricted}
                      onClick={() => setActiveCapability(cap.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                        isActive
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/70 hover:bg-muted"
                      }`}
                    >
                      <cap.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                        {cap.label}
                      </span>
                      {restricted && (
                        <Lock
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Tiêu chuẩn vận hành AI Doanh nghiệp
            </h2>
            <ul className="space-y-1.5">
              {[
                "AI chỉ phân tích dựa trên dữ liệu doanh nghiệp mà bạn có thẩm quyền.",
                "Tự động đối soát và bảo mật dữ liệu theo chuẩn Enterprise PostgreSQL.",
                "Hỗ trợ nhập Excel / CSV tự động ánh xạ schema vào hệ thống.",
                "Tự động tạo văn bản chuẩn Word / PDF để trình ký ban giám đốc.",
              ].map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-2 text-[12px] leading-snug text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <ExcelImportModal
        open={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onImportSuccess={handleExcelImportSuccess}
      />
    </AppShell>
  );
}

function WelcomePanel({
  onPick,
  capabilities,
  rank,
}: {
  onPick: (p: string) => void;
  capabilities: typeof CAPABILITIES;
  rank: number;
}) {
  const hasRestricted = CAPABILITIES.some((c) => !canUseCapability(c, rank));
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <div
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
          aria-hidden="true"
        >
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Xin chào, tôi là Trợ lý AI Điều Hành ViOne Platform 5.0
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Tôi hỗ trợ lãnh đạo tự động hóa quy trình quản trị — tự động soạn thảo hợp đồng B2B, nhập liệu thông minh từ tệp Excel, quản trị cơ hội giao thương, chấm công GPS FaceID, kiểm soát duyệt chi ngân sách và phân tích hiệu suất C-Level.
        </p>
        <div className="mx-auto mt-4 flex max-w-lg items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-left">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-[12px] leading-snug text-muted-foreground">
            Mỗi câu trả lời sẽ gồm: nội dung, tóm tắt suy luận, dẫn chứng, hành động gợi ý và mô-đun
            liên quan. Nếu không có dữ liệu phù hợp, tôi sẽ nói rõ.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {capabilities.map((cap) => (
          <div key={cap.id}>
            <div className="mb-2 flex items-center gap-2">
              <cap.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cap.label}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {cap.suggestedPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPick(p)}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasRestricted && (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Một số năng lực chuyên sâu (như duyệt chi, điều hành) chỉ dành cho ban giám đốc và quản trị viên.
        </p>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  copied,
  onCopy,
  onNewTopic,
  onRetry,
  onStartWorkflow,
  activeRunWorkflowId,
}: {
  msg: ChatMessage;
  copied: boolean;
  onCopy: () => void;
  onNewTopic: () => void;
  onRetry: () => void;
  onStartWorkflow: (workflowId: string) => void;
  activeRunWorkflowId: string | null;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">
          {msg.content}
        </div>
      </div>
    );
  }

  const s = msg.structured;
  const [speaking, setSpeaking] = useState(false);

  const toggleSpeak = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = s?.voiceText || s?.answer || msg.content;
    if (!text) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\*\#\`\_]/g, " ").replace(/\s+/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    utterance.rate = 1.05;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [speaking, s, msg.content]);

  return (
    <div className="flex gap-3">
      <div
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {msg.pending ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Đang định tuyến năng lực và soạn câu trả lời…
          </div>
        ) : (
          <>
            {/* Provider status — clear QA/acceptance signal */}
            {s?.providerStatus && (
              <div className="mb-2">
                {s.providerStatus === "real" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Provider thật{s.model ? ` · ${s.model}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {s.providerStatus === "fallback" ? "Dự phòng (fallback)" : "Mô phỏng (mock)"}
                    {s.model ? ` · ${s.model}` : ""}
                  </span>
                )}
              </div>
            )}
            {/* Fallback notice — real provider degraded to mock */}
            {s?.fallbackNotice && (
              <div className="mb-3 flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{s.fallbackNotice}</span>
                </div>
                {msg.retryText && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex w-fit items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1 text-[12px] font-medium text-warning transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/50 dark:text-warning"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Thử lại với provider thật
                  </button>
                )}
              </div>
            )}

            {/* Answer */}
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
              {s?.answer ?? msg.content}
            </div>

            {/* Excel Report Card */}
            {s?.excelReport && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {s.excelReport.title || s.excelReport.filename}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.excelReport.rowCount} bản ghi CSDL thực tế • Kích thước: {s.excelReport.fileSize} • Định dạng .xlsx
                      </p>
                    </div>
                  </div>
                  <a
                    href={s.excelReport.downloadUrl}
                    download={s.excelReport.filename}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải Báo Cáo Excel</span>
                  </a>
                </div>
              </div>
            )}

            {/* Multi-Format Generated Files Cards (Excel, Word .docx, PDF) */}
            {s?.generatedFiles && s.generatedFiles.length > 0 && (
              <div className="mt-3 space-y-2.5">
                {s.generatedFiles.map((f, idx) => {
                  const isExcel = f.fileType === "excel" || f.filename.endsWith(".xlsx");
                  const isWord = f.fileType === "word" || f.filename.endsWith(".docx");

                  return (
                    <div
                      key={f.id || idx}
                      className={`overflow-hidden rounded-2xl border p-4 shadow-sm transition-all ${
                        isExcel
                          ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10"
                          : isWord
                          ? "border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10"
                          : "border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-amber-500/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                              isExcel
                                ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400"
                                : isWord
                                ? "bg-blue-600/20 text-blue-600 dark:text-blue-400"
                                : "bg-rose-600/20 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isExcel ? (
                              <FileSpreadsheet className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              {f.title || f.filename}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Định dạng chuẩn {isExcel ? "Excel (.xlsx)" : isWord ? "Word (.docx)" : "PDF (.pdf)"} • Kích thước: {f.fileSize}
                              {f.recordCount ? ` • ${f.recordCount} bản ghi thực tế` : ""}
                            </p>
                          </div>
                        </div>
                        <a
                          href={f.downloadUrl}
                          download={f.filename}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition cursor-pointer ${
                            isExcel
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                              : isWord
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                              : "bg-gradient-to-r from-rose-600 to-red-600"
                          }`}
                        >
                          <Download className="h-4 w-4" />
                          <span>Tải Tệp {isExcel ? "Excel" : isWord ? "Word" : "PDF"}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {s && (
              <div className="mt-3 space-y-3">
                {/* Reasoning summary */}
                <Section icon={Lightbulb} title="Tóm tắt suy luận">
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{s.reasoning}</p>
                </Section>

                {/* Evidence */}
                <Section icon={FileSearch} title="Dẫn chứng">
                  {s.evidence.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      No evidence found in your accessible data.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {s.evidence.map((e: any) => (
                        <li
                          key={e.id}
                          className="rounded-lg border border-border/70 bg-card px-3 py-2"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {e.type}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                              {e.title}
                            </span>
                            {e.route && (
                              <Link
                                to={e.route}
                                className="shrink-0 text-[11px] text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                Mở
                              </Link>
                            )}
                          </div>
                          {e.subtitle && (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {e.subtitle}
                            </p>
                          )}
                          {e.safeSummary && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {e.safeSummary}
                            </p>
                          )}
                          {e.updatedAt && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              Cập nhật: {e.updatedAt}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Limitations */}
                {s.limitations.length > 0 && (
                  <Section icon={Info} title="Giới hạn">
                    <ul className="space-y-1">
                      {s.limitations.map((l) => (
                        <li key={l} className="text-[13px] leading-snug text-muted-foreground">
                          • {l}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Low-confidence clarification */}
                {s.clarificationQuestion && (
                  <Section icon={HelpCircle} title="Cần làm rõ">
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      {s.clarificationQuestion}
                    </p>
                  </Section>
                )}

                {s.actions.length > 0 && (
                  <Section icon={ArrowRight} title="Hành động gợi ý">
                    <div className="flex flex-wrap gap-2">
                      {s.actions.map((a: any) => {
                        if (a.route) {
                          return (
                            <Link
                              key={a.label}
                              to={a.route}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {a.label}
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={a.label}
                            type="button"
                            disabled={a.disabled}
                            title={a.reason}
                            onClick={() => {
                              if (a.intent === "new-topic") onNewTopic();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          >
                            {a.label}
                            {a.disabled && a.reason ? (
                              <span className="text-[10px] text-muted-foreground">
                                ({a.reason})
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* Action plan */}
                {s.plan && s.plan.steps.length > 0 && (
                  <Section icon={ListChecks} title="Kế hoạch hành động">
                    <ol className="space-y-1">
                      {s.plan.steps.map((step) => (
                        <li
                          key={step.order}
                          className="flex items-start gap-2 text-[13px] text-muted-foreground"
                        >
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {step.order}
                          </span>
                          <span className="leading-snug">{step.label}</span>
                        </li>
                      ))}
                    </ol>
                  </Section>
                )}

                {/* Tool cards (Copilot-style actions) */}
                {s.toolCards && s.toolCards.length > 0 && (
                  <Section icon={Wand2} title="Thao tác gợi ý">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {s.toolCards.map(({ tool, availability }) => (
                        <ToolCard key={tool.id} tool={tool} availability={availability} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Workflow proposal (human-in-the-loop) */}
                {s.workflow?.workflow && (
                  <Section icon={Workflow} title="Quy trình đề xuất">
                    <WorkflowProposal
                      plan={s.workflow}
                      onStart={onStartWorkflow}
                      activeRunWorkflowId={activeRunWorkflowId}
                    />
                  </Section>
                )}

                {s.relatedModules.length > 0 && (
                  <Section icon={Layers} title="Mô-đun liên quan">
                    <div className="flex flex-wrap gap-2">
                      {s.relatedModules.map((r: any) => (
                        <Link
                          key={r.to + r.label}
                          to={r.to}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {r.label}
                        </Link>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* Document Card if document was generated */}
            {s?.document && (
              <div className="mt-3.5 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground">{s.document.name}</span>
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {s.document.code}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground">{s.document.category} • Đã lưu vào CSDL PostgreSQL</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CircleCheck className="h-3.5 w-3.5" /> Sẵn sàng trình ký
                  </span>
                </div>

                {s.document.description && (
                  <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">{s.document.description}</p>
                )}

                {s.document.content && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-background/80 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                    <pre className="whitespace-pre-wrap font-sans">{s.document.content.slice(0, 1000)}...</pre>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([s.document?.content || s.document?.name || ""], { type: "application/msword;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${s.document?.code || "van-ban-vione"}.doc`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Đang tải xuống văn bản Word (.doc)...");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                  >
                    <Download className="h-3.5 w-3.5" /> Tải văn bản Word (.doc)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>${s.document?.name || "Văn bản ViOne"}</title>
                              <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                                h1 { color: #8a6d3b; font-size: 20px; border-bottom: 2px solid #8a6d3b; padding-bottom: 8px; }
                                .code { color: #666; font-size: 13px; margin-bottom: 20px; }
                                pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
                              </style>
                            </head>
                            <body>
                              <h1>${s.document?.name}</h1>
                              <div class="code">Mã hiệu: ${s.document?.code} | Phân loại: ${s.document?.category}</div>
                              <pre>${s.document?.content || ""}</pre>
                              <script>window.print();</script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" /> In & Lưu PDF (.pdf)
                  </button>

                  <Link
                    to="/documents"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted"
                  >
                    Kho Tài liệu CRM <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onCopy}
                aria-label="Sao chép câu trả lời"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>

              <button
                type="button"
                onClick={toggleSpeak}
                aria-label={speaking ? "Dừng đọc" : "Nghe AI đọc câu trả lời"}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  speaking
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {speaking ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 animate-pulse" /> Dừng đọc
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-primary" /> Nghe AI đọc
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToolCard({ tool, availability }: { tool: AiTool; availability: ToolAvailability }) {
  const [confirming, setConfirming] = useState(false);
  const Icon = tool.icon;
  const disabled = !availability.allowed;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
        disabled
          ? "border-border/60 bg-muted/20 opacity-70"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-medium text-foreground">{tool.name}</p>
            {tool.requiresConfirmation && (
              <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-warning">
                Cần xác nhận
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {tool.description}
          </p>
        </div>
      </div>

      {disabled ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {availability.reason ?? "Không khả dụng"}
        </div>
      ) : tool.requiresConfirmation && !confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {tool.name}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : tool.requiresConfirmation && confirming ? (
        <div className="flex items-center gap-2">
          <Link
            to={tool.route}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Xác nhận & mở
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Huỷ
          </button>
        </div>
      ) : (
        <Link
          to={tool.route}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {tool.name}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const STEP_TYPE_LABEL: Record<string, string> = {
  READ: "Đọc",
  SEARCH: "Tìm kiếm",
  ANALYZE: "Phân tích",
  GENERATE: "Tạo nội dung",
  NAVIGATE: "Điều hướng",
  EXPORT: "Xuất dữ liệu",
  SEND: "Gửi",
  DELETE: "Xóa",
  APPROVE: "Phê duyệt",
};

function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === "succeeded")
    return <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />;
  if (status === "failed")
    return <CircleAlert className="h-4 w-4 text-destructive" aria-hidden="true" />;
  if (status === "awaiting-confirmation")
    return <ShieldAlert className="h-4 w-4 text-warning" aria-hidden="true" />;
  if (status === "skipped" || status === "cancelled")
    return <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
  return <CircleDashed className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />;
}

function WorkflowProposal({
  plan,
  onStart,
  activeRunWorkflowId,
}: {
  plan: WorkflowPlan;
  onStart: (workflowId: string) => void;
  activeRunWorkflowId: string | null;
}) {
  const wf = plan.workflow;
  if (!wf) return null;
  const Icon = wf.icon;
  const isRunning = activeRunWorkflowId === wf.id;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">{wf.name}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {wf.description}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />~{totalEstimatedDuration(wf)}s
          </span>
        </div>

        <ol className="mt-2 space-y-1">
          {wf.steps.map((st, i) => (
            <li key={st.id} className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-semibold text-foreground">
                {i + 1}
              </span>
              <span className="truncate">{st.title}</span>
              <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                {STEP_TYPE_LABEL[st.type] ?? st.type}
              </span>
              {st.requiresConfirmation && (
                <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[9px] text-warning">
                  xác nhận
                </span>
              )}
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => onStart(wf.id)}
          disabled={isRunning}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          {isRunning ? "Đang chạy trong bảng bên phải" : "Xem trước & chạy quy trình"}
        </button>
      </div>

      {plan.suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Quy trình khác phù hợp:
          </p>
          <div className="flex flex-wrap gap-2">
            {plan.suggestions.map((sw) => (
              <button
                key={sw.id}
                type="button"
                onClick={() => onStart(sw.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <sw.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {sw.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowRunner({
  run,
  onConfirm,
  onSkip,
  onRetry,
  onCancel,
  onClose,
}: {
  run: WorkflowRun;
  onConfirm: (stepId: string) => void;
  onSkip: (stepId: string) => void;
  onRetry: (stepId: string) => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const awaiting = run.steps.find((s) => s.status === "awaiting-confirmation");
  const failed = run.steps.find((s) => s.status === "failed");
  const done = run.outcome === "completed" || run.outcome === "cancelled";
  const succeededCount = run.steps.filter((s) => s.status === "succeeded").length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Workflow className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {run.name}
        </h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            run.outcome === "completed"
              ? "bg-success/15 text-success"
              : run.outcome === "cancelled" || run.outcome === "failed"
                ? "bg-destructive/15 text-destructive"
                : "bg-warning/15 text-warning"
          }`}
        >
          {run.outcome === "completed"
            ? "Hoàn tất"
            : run.outcome === "cancelled"
              ? "Đã hủy"
              : run.outcome === "paused"
                ? "Chờ xử lý"
                : "Đang chạy"}
        </span>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(succeededCount / run.steps.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-2">
        {run.steps.map((rs, i) => (
          <li key={rs.step.id} className="rounded-xl border border-border/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <StepStatusIcon status={rs.status} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {i + 1}. {rs.step.title}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {STEP_TYPE_LABEL[rs.step.type] ?? rs.step.type}
              </span>
            </div>
            <p className="mt-0.5 pl-6 text-[11px] leading-snug text-muted-foreground">
              {rs.step.description}
            </p>
            {rs.error && <p className="mt-0.5 pl-6 text-[11px] text-destructive">{rs.error}</p>}
          </li>
        ))}
      </ol>

      {/* Confirmation dialog for protected step */}
      {awaiting && (
        <div className="mt-3 rounded-xl border border-warning/40 bg-warning/5 p-3">
          <p className="text-[12px] font-medium text-foreground">Cần xác nhận</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Bước “{awaiting.step.title}” ({STEP_TYPE_LABEL[awaiting.step.type]}) là thao tác được
            bảo vệ. Vui lòng xác nhận trước khi tiếp tục. Không có dữ liệu nào bị thay đổi ngoài ý
            muốn.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onConfirm(awaiting.step.id)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Xác nhận
            </button>
            <button
              type="button"
              onClick={() => onSkip(awaiting.step.id)}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Error recovery */}
      {failed && (
        <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-[12px] font-medium text-foreground">Một bước bị lỗi</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {failed.error ?? "Bước không thể thực hiện."} Bạn có thể thử lại, bỏ qua hoặc hủy quy
            trình.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onRetry(failed.step.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Thử lại
            </button>
            <button
              type="button"
              onClick={() => onSkip(failed.step.id)}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {done ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-border px-3 py-1.5 text-[12px] text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Đóng
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Hủy quy trình
          </button>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function ExcelImportModal({
  open,
  onClose,
  onImportSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onImportSuccess: (count: number, category: string, filename: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("companies");
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const processFile = (f: File) => {
    setFile(f);
    if (f.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        const headers = lines[0]?.split(",").map((h) => h.trim().replace(/^["']|["']$/g, "")) || [];
        const parsed = lines.slice(1, 6).map((line) => {
          const vals = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = vals[idx] || "";
          });
          return obj;
        });
        setPreviewRows(parsed);
      };
      reader.readAsText(f);
    } else {
      setPreviewRows([
        { "Mẫu dữ liệu": "Tệp bảng tính Microsoft Excel (.xlsx)", "Định dạng": "Nhị phân bảo mật", "Trạng thái": "Sẵn sàng nạp vào CSDL PostgreSQL" },
      ]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Vui lòng chọn tệp Excel hoặc CSV để nhập.");
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetchNestApi<any>("/ai/excel-import", {
          method: "POST",
          body: JSON.stringify({
            fileBase64: base64,
            filename: file.name,
            category,
          }),
        });
        setLoading(false);
        if (res && res.success) {
          toast.success(`Đã tự động nạp thành công ${res.count} dòng dữ liệu vào CSDL PostgreSQL!`);
          onImportSuccess(res.count, category, file.name);
          onClose();
        } else {
          toast.error(res?.message || "Lỗi khi nhập dữ liệu Excel.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setLoading(false);
      toast.error("Không thể xử lý tệp: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Tự Động Nhập Liệu Excel / CSV</h3>
            <p className="text-xs text-muted-foreground">Tự động nhận diện schema, ánh xạ cột và lưu vào CSDL PostgreSQL</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Phân hệ tiếp nhận dữ liệu:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="companies">🏢 Danh sách Doanh nghiệp thành viên (public.companies)</option>
              <option value="members">👥 Danh bạ & Khách hàng CRM (public.members)</option>
              <option value="opportunities">💼 Cơ hội Giao thương B2B (public.business_opportunities)</option>
              <option value="products">🛒 Sản phẩm Marketplace B2B (public.products)</option>
              <option value="tasks">📋 Công việc & Tiến độ (public.tasks)</option>
            </select>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) processFile(f);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:border-primary/50"
          >
            <UploadCloud className="h-10 w-10 text-primary/80" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              {file ? file.name : "Kéo thả tệp Excel (.xlsx, .xls) hoặc CSV vào đây"}
            </p>
            <p className="text-xs text-muted-foreground">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Hỗ trợ định dạng Microsoft Excel 2016+, CSV UTF-8"}
            </p>
            <label className="mt-3 cursor-pointer rounded-xl bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
              Chọn tệp từ máy tính
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {previewRows.length > 0 && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Xem trước cấu trúc ({previewRows.length} dòng mẫu):</span>
                <span className="text-[11px] font-medium text-emerald-600">✓ Sẵn sàng import</span>
              </div>
              <div className="max-h-36 overflow-auto rounded-xl border border-border bg-background text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      {Object.keys(previewRows[0] || {}).slice(0, 4).map((h) => (
                        <th key={h} className="border-b border-border px-2.5 py-1.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/40">
                        {Object.values(r).slice(0, 4).map((v: any, j) => (
                          <td key={j} className="truncate px-2.5 py-1 text-foreground max-w-[120px]">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!file || loading}
              onClick={handleImport}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang nạp dữ liệu...
                </>
              ) : (
                <>
                  <CircleCheck className="h-4 w-4" /> Xác nhận nạp vào CSDL
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

