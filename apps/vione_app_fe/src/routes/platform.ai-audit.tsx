import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Bot,
  ShieldCheck,
  Search,
  X,
  RotateCcw,
  Eye,
  Sparkles,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Handshake,
  Activity,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useLang, useT } from "@/lib/i18n";
import {
  listAiRequestAuditFn,
  type AiAuditEntry,
  type AiAuditFilter,
} from "@/lib/ai-audit.functions";

export const Route = createFileRoute("/platform/ai-audit")({
  component: AiAuditPage,
});

type StatusFilter = "all" | "fallback" | "real";

export const AI_CAPABILITIES: {
  key: string;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
}[] = [
  {
    key: "ai_copilot",
    label: "Trợ Lý Điều Hành AI Copilot",
    shortLabel: "AI Copilot",
    icon: Sparkles,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300",
  },
  {
    key: "ai_ocr",
    label: "Quét & Nhận Diện Danh Thiếp AI OCR",
    shortLabel: "AI OCR",
    icon: CreditCard,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    key: "ai_excel_import",
    label: "Tự Động Hóa Nhập Liệu Bảng Tính Excel AI",
    shortLabel: "AI Excel Import",
    icon: FileSpreadsheet,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  {
    key: "ai_doc_gen",
    label: "Soạn Thảo Hợp Đồng & Văn Bản Doanh Nghiệp AI",
    shortLabel: "AI Soạn Thảo",
    icon: FileText,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300",
  },
  {
    key: "ai_matchmaking",
    label: "Gợi Ý Đối Tác & Ghép Nối Chuỗi Giá Trị AI",
    shortLabel: "AI Matchmaking",
    icon: Handshake,
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300",
  },
  {
    key: "ai_workload",
    label: "Giám Sát Tải Nhân Sự & Cảnh Báo Vận Hành AI",
    shortLabel: "AI Giám Sát",
    icon: Activity,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300",
  },
];

function getCapabilityBadge(capKey: string | null): {
  key: string;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
} {
  if (!capKey) {
    return {
      key: "ai_copilot",
      label: "AI Tự Động Hóa",
      shortLabel: "AI General",
      icon: Sparkles,
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }
  const clean = capKey.toLowerCase();
  const match = AI_CAPABILITIES.find(
    (c) =>
      clean.includes(c.key) ||
      clean.includes(c.key.replace("ai_", "")) ||
      clean.includes(c.shortLabel.toLowerCase()),
  );
  if (match) return match;

  if (clean.includes("copilot") || clean.includes("chat")) return AI_CAPABILITIES[0];
  if (clean.includes("ocr") || clean.includes("card")) return AI_CAPABILITIES[1];
  if (clean.includes("excel") || clean.includes("import") || clean.includes("sheet")) return AI_CAPABILITIES[2];
  if (clean.includes("doc") || clean.includes("contract") || clean.includes("draft")) return AI_CAPABILITIES[3];
  if (clean.includes("match") || clean.includes("recommend") || clean.includes("partner")) return AI_CAPABILITIES[4];
  if (clean.includes("workload") || clean.includes("monitor") || clean.includes("heatmap")) return AI_CAPABILITIES[5];

  return {
    key: capKey,
    label: capKey,
    shortLabel: capKey,
    icon: Bot,
    color: "bg-primary/10 text-primary",
  };
}

function AiAuditPage() {
  const t = useT();
  const { lang } = useLang();
  const { isPlatformAdmin, isAdmin, isBQT, loading: roleLoading } = useRole();
  const hasAccess = isPlatformAdmin || isAdmin || isBQT;

  const fetchLog = useServerFn(listAiRequestAuditFn);

  // Filter inputs
  const [capabilityFilter, setCapabilityFilter] = useState("all");
  const [user, setUser] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const [applied, setApplied] = useState<AiAuditFilter>({});
  const [detail, setDetail] = useState<AiAuditEntry | null>(null);

  const {
    data: rows,
    loading,
    reload,
  } = useServerData<AiAuditEntry[]>(
    () => (hasAccess ? fetchLog({ data: applied }) : Promise.resolve([])),
    [],
  );

  useEffect(() => {
    if (hasAccess) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, applied]);

  const apply = () => {
    const f: AiAuditFilter = {};
    if (user.trim()) f.userId = user.trim();
    if (from) f.from = new Date(from).toISOString();
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      f.to = d.toISOString();
    }
    if (provider) f.provider = provider;
    if (status === "fallback") f.usedFallback = true;
    if (status === "real") f.usedFallback = false;
    setApplied(f);
  };

  const reset = () => {
    setCapabilityFilter("all");
    setUser("");
    setFrom("");
    setTo("");
    setProvider("");
    setStatus("all");
    setApplied({});
  };

  if (!roleLoading && !hasAccess) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const rawList = rows ?? [];

  // Filter in-memory by capability to accurately match 6 AI features
  const filteredList = useMemo(() => {
    if (capabilityFilter === "all") return rawList;
    return rawList.filter((r) => {
      const b = getCapabilityBadge(r.capability);
      return b.key === capabilityFilter;
    });
  }, [rawList, capabilityFilter]);

  const providers = [...new Set(rawList.map((r: any) => r.provider).filter(Boolean))] as string[];

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary";

  return (
    <PlatformShell>
      <PageHeader
        title="Nhật Ký Hoạt Động & Kiểm Toán Trí Tuệ Nhân Tạo AI"
        subtitle="Giám sát minh bạch mọi tác vụ xử lý thông minh của 6 phân hệ AI ViOne Platform theo thời gian thực"
      />

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Tổng Lượt Xử Lý AI"
          value={rawList.length}
          tone="primary"
          icon={<Bot className="h-4 w-4" />}
        />
        <StatCard
          label="Đàm Thoại AI Copilot"
          value={rawList.filter((r) => getCapabilityBadge(r.capability).key === "ai_copilot").length}
          tone="info"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label="Tự Động Hóa & Soạn Thảo"
          value={rawList.filter((r) => ["ai_excel_import", "ai_doc_gen"].includes(getCapabilityBadge(r.capability).key)).length}
          tone="success"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Độ Chính Xác Trực Tiếp"
          value={`${rawList.length > 0 ? Math.round(((rawList.length - rawList.filter((r) => r.usedFallback).length) / rawList.length) * 100) : 100}%`}
          tone="warning"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Bộ Lọc Nghiệp Vụ Khớp Chuẩn 6 Tính Năng AI */}
      <Card className="mb-5 p-4 border border-border">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Lọc theo Chức năng AI */}
          <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
            Chức Năng Nghiệp Vụ AI
            <select
              className={inputCls}
              value={capabilityFilter}
              onChange={(e) => setCapabilityFilter(e.target.value)}
            >
              <option value="all">⚡ Tất cả 6 chức năng AI</option>
              {AI_CAPABILITIES.map((cap) => (
                <option key={cap.key} value={cap.key}>
                  {cap.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
            Người Dùng / Email
            <input
              className={inputCls}
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Nhập email hoặc tên tài khoản..."
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
            Mô Hình / Đơn Vị Cung Cấp
            <select
              className={inputCls}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="">Tất cả nhà cung cấp</option>
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
            Từ Ngày
            <input
              type="date"
              className={inputCls}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
            Đến Ngày
            <input
              type="date"
              className={inputCls}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
            Trạng Thái Phản Hồi
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="real">Xử lý trực tiếp thành công</option>
              <option value="fallback">Có kích hoạt Fallback</option>
            </select>
          </label>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={apply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-105 transition-all shadow-sm"
            >
              <Search className="h-3.5 w-3.5" />
              Áp dụng bộ lọc
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            Hiển thị <strong>{filteredList.length}</strong> / {rawList.length} bản ghi kiểm toán AI
          </span>
        </div>
      </Card>

      {/* Bảng Nhật Ký AI Khớp Chuẩn */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/70 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Thời Điểm</th>
                <th className="px-4 py-3">Tài Khoản Người Dùng</th>
                <th className="px-4 py-3">Chức Năng Nghiệp Vụ AI</th>
                <th className="px-4 py-3">Đơn Vị & Mô Hình Xử Lý</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-center">Độ Trễ</th>
                <th className="px-4 py-3 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải nhật ký kiểm toán AI...
                  </td>
                </tr>
              )}
              {!loading && filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    <Bot className="mx-auto mb-2 h-7 w-7 opacity-40" />
                    Không tìm thấy yêu cầu AI nào khớp với tiêu chí lọc
                  </td>
                </tr>
              )}
              {filteredList.map((r: any) => {
                const capBadge = getCapabilityBadge(r.capability);
                const CapIcon = capBadge.icon;

                return (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground font-mono">
                      {fmtTime(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {r.userName ?? r.userEmail ?? r.userId?.slice(0, 8) ?? "Hệ thống"}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground font-mono">
                        {r.userEmail ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${capBadge.color}`}
                      >
                        <CapIcon className="h-3.5 w-3.5 shrink-0" />
                        {capBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.provider ?? "ViOne AI"}</div>
                      <div className="text-[10.5px] text-muted-foreground font-mono">
                        {r.model ?? "standard-engine"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Pill color={r.usedFallback ? "warning" : "success"}>
                        {r.usedFallback ? "Fallback" : "Thành công"}
                      </Pill>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono text-muted-foreground">
                      {r.totalLatencyMs != null ? `${r.totalLatencyMs}ms` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setDetail(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Chi Tiết Kiểm Toán AI */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chi Tiết Bản Ghi Kiểm Toán AI
              </h3>
              <button
                onClick={() => setDetail(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-2.5 text-xs">
              <Row label="Mã Yêu Cầu (ID)" value={detail.requestId} />
              <Row label="Thời Điểm Thực Hiện" value={fmtTime(detail.createdAt)} />
              <Row
                label="Người Thực Hiện"
                value={detail.userName ? `${detail.userName} (${detail.userEmail || detail.userId})` : detail.userEmail || detail.userId || "—"}
              />
              <Row
                label="Chức Năng AI"
                value={getCapabilityBadge(detail.capability).label}
              />
              <Row label="Cấp Quyền Truy Cập" value={detail.permissionLevel ?? "executive"} />
              <Row label="Nhà Cung Cấp / Engine" value={detail.provider ?? "ViOne AI"} />
              <Row label="Mô Hình Ngôn Ngữ" value={detail.model ?? "—"} />
              <Row
                label="Trạng Thái Xử Lý"
                value={detail.usedFallback ? "Kích hoạt xử lý dự phòng (Fallback)" : "Xử lý trực tiếp thành công 100%"}
              />
              {detail.usedFallback && (
                <Row
                  label="Lý Do Fallback"
                  value={detail.fallbackReason ?? "Mạng chậm hoặc nhà cung cấp quá tải"}
                />
              )}
              <Row
                label="Độ Trễ Nhà Cung Cấp"
                value={detail.providerLatencyMs != null ? `${detail.providerLatencyMs}ms` : "—"}
              />
              <Row
                label="Tổng Thời Gian Phản Hồi"
                value={detail.totalLatencyMs != null ? `${detail.totalLatencyMs}ms` : "—"}
              />
              <Row
                label="Nguồn Dữ Liệu Tham Chiếu"
                value={`${detail.sourceCount || 0} nguồn (${detail.sourceTypes?.join(", ") || "Dữ liệu CSDL ViOne"})`}
              />
            </dl>
          </div>
        </div>
      )}
    </PlatformShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1 border-b border-border/50 last:border-0">
      <dt className="w-40 shrink-0 font-medium text-muted-foreground">{label}:</dt>
      <dd className="break-all font-semibold text-foreground">{value}</dd>
    </div>
  );
}
