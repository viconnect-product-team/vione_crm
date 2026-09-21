import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  RefreshCcw,
  AlertTriangle,
  Sparkles,
  ScrollText,
  FileDown,
} from "lucide-react";

import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { exportRenewalAuditPDF } from "@/lib/renewal-audit-export";
import { getMyRenewalAuditLog, type RenewalAuditEntry } from "@/lib/member-app/renewal.functions";

export const Route = createFileRoute("/m/renew/audit")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : "",
  }),
  component: RenewalAuditLogScreen,
  head: () => ({
    meta: [
      { title: "Nhật ký gia hạn — Business Connect" },
      {
        name: "description",
        content:
          "Xem toàn bộ lần thanh toán gia hạn hội viên, phân biệt lần thực sự thanh toán với lần bấm lặp (idempotent) và lần thất bại.",
      },
      { property: "og:title", content: "Nhật ký gia hạn" },
      {
        property: "og:description",
        content: "Phân biệt lần thực sự thanh toán với lần bấm lặp và lần thất bại.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const EMPTY: RenewalAuditEntry[] = [];

function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FilterKey = "all" | "payment" | "idempotent_noop" | "failure";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "payment", label: "Đã thanh toán" },
  { key: "idempotent_noop", label: "Bấm lặp (idempotent)" },
  { key: "failure", label: "Thất bại" },
];

function EventBadge({ e }: { e: RenewalAuditEntry["eventType"] }) {
  if (e === "payment") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Thanh toán thật
      </span>
    );
  }
  if (e === "idempotent_noop") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
        <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
        Bấm lặp — không phát sinh
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      Thất bại
    </span>
  );
}

function RenewalAuditLogScreen() {
  const { ref: focusRef } = Route.useSearch();
  const navigate = useNavigate();
  const fetchLog = useServerFn(getMyRenewalAuditLog);
  const { data, loading, reload } = useServerData<RenewalAuditEntry[]>(() => fetchLog(), EMPTY);
  const [filter, setFilter] = useState<FilterKey>(focusRef ? "failure" : "all");
  const [exporting, setExporting] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  // Realtime: bản ghi audit mới (payment / idempotent_noop / failure) xuất hiện ngay.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    const timer = setInterval(() => {
      void reloadRef.current();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    if (focusRef) return data.filter((r) => r.reference === focusRef);
    return filter === "all" ? data : data.filter((r) => r.eventType === filter);
  }, [data, filter, focusRef]);

  const stats = useMemo(() => {
    const payments = data.filter((r) => r.eventType === "payment");
    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((s, r) => s + r.amountPaid, 0),
      idempotent: data.filter((r) => r.eventType === "idempotent_noop").length,
      failures: data.filter((r) => r.eventType === "failure").length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[var(--vba-bg,#0b1220)] pb-24 text-primary-foreground">
      <MemberHeader title="Nhật ký gia hạn" back />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <p aria-live="polite" className="sr-only">
          {liveCount > 0 ? `Đã nhận ${liveCount} sự kiện gia hạn mới theo thời gian thực.` : ""}
        </p>
        {liveCount > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-xs text-success">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Đang cập nhật trực tiếp · {liveCount} sự kiện mới trong phiên này
          </div>
        )}
        {focusRef && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-[var(--vba-gold,#f4c063)]/30 bg-[var(--vba-gold,#f4c063)]/10 px-3 py-2 text-xs text-[var(--vba-gold,#f4c063)]">
            <span>
              Đang xem bản ghi Ref <span className="font-mono">{focusRef}</span>
            </span>
            <button
              type="button"
              onClick={() => navigate({ to: "/m/renew/audit", search: { ref: "" } })}
              className="rounded-full border border-border/15 px-2.5 py-1 text-[11px] text-primary-foreground/80 hover:bg-card/10"
            >
              Xem tất cả
            </button>
          </div>
        )}
        {/* Summary */}
        <section className="grid grid-cols-3 gap-2" aria-label="Tổng quan nhật ký gia hạn">
          <div className="rounded-xl border border-border/10 bg-card/5 p-3">
            <div className="text-[11px] uppercase tracking-wide text-primary-foreground/60">
              Đã thanh toán
            </div>
            <div className="mt-1 text-lg font-semibold text-success">{stats.totalPayments}</div>
            <div className="text-[11px] text-primary-foreground/60">
              {fmtVND(stats.totalAmount)}
            </div>
          </div>
          <div className="rounded-xl border border-border/10 bg-card/5 p-3">
            <div className="text-[11px] uppercase tracking-wide text-primary-foreground/60">
              Bấm lặp
            </div>
            <div className="mt-1 text-lg font-semibold text-primary">{stats.idempotent}</div>
            <div className="text-[11px] text-primary-foreground/60">Không phát sinh</div>
          </div>
          <div className="rounded-xl border border-border/10 bg-card/5 p-3">
            <div className="text-[11px] uppercase tracking-wide text-primary-foreground/60">
              Thất bại
            </div>
            <div className="mt-1 text-lg font-semibold text-destructive">{stats.failures}</div>
            <div className="text-[11px] text-primary-foreground/60">Cần rà soát</div>
          </div>
        </section>

        {/* Filters */}
        <section
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Lọc theo loại sự kiện"
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-[var(--vba-gold,#f4c063)] bg-[var(--vba-gold,#f4c063)]/15 text-[var(--vba-gold,#f4c063)]"
                    : "border-border/10 bg-card/5 text-primary-foreground/70 hover:bg-card/10"
                }`}
              >
                {f.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => reload()}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/10 bg-card/5 px-3 py-1.5 text-xs text-primary-foreground/70 hover:bg-card/10"
            aria-label="Làm mới nhật ký"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            Làm mới
          </button>
          <button
            type="button"
            disabled={exporting || filtered.length === 0}
            onClick={async () => {
              setExporting(true);
              try {
                await exportRenewalAuditPDF(filtered, {
                  filterLabel: FILTERS.find((f) => f.key === filter)?.label ?? "Tất cả",
                });
              } finally {
                setExporting(false);
              }
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--vba-gold,#f4c063)]/40 bg-[var(--vba-gold,#f4c063)]/10 px-3 py-1.5 text-xs text-[var(--vba-gold,#f4c063)] transition hover:bg-[var(--vba-gold,#f4c063)]/20 disabled:opacity-40"
            aria-label="Xuất nhật ký gia hạn ra PDF"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden />
            {exporting ? "Đang xuất…" : "Xuất PDF"}
          </button>
        </section>

        {/* List */}
        <section aria-label="Danh sách sự kiện gia hạn" aria-busy={loading} className="mt-4">
          <ul role="list" className="space-y-2">
            {loading && filtered.length === 0 && (
              <li className="rounded-xl border border-border/10 bg-card/5 p-4 text-sm text-primary-foreground/60">
                Đang tải nhật ký…
              </li>
            )}
            {!loading && filtered.length === 0 && (
              <li className="rounded-xl border border-dashed border-border/10 bg-card/5 p-6 text-center text-sm text-primary-foreground/60">
                <ScrollText
                  className="mx-auto mb-2 h-6 w-6 text-primary-foreground/40"
                  aria-hidden
                />
                {focusRef
                  ? "Không tìm thấy bản ghi audit cho mã tham chiếu này."
                  : "Chưa có sự kiện nào trong nhật ký."}
              </li>
            )}
            {filtered.map((r: any) => (
              <li key={r.id} className="rounded-xl border border-border/10 bg-card/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <EventBadge e={r.eventType} />
                    <div className="mt-2 text-sm font-medium">
                      {r.eventType === "payment"
                        ? fmtVND(r.amountPaid)
                        : r.eventType === "idempotent_noop"
                          ? "Bấm lặp — 0 ₫"
                          : "Không phát sinh giao dịch"}
                    </div>
                    <div className="mt-0.5 text-xs text-primary-foreground/60">
                      {fmtDateTime(r.createdAt)} · Ref{" "}
                      <span className="font-mono">{r.reference}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-primary-foreground/60">
                    {r.method && <div className="uppercase tracking-wide">{r.method}</div>}
                    {r.invoiceNo && (
                      <div className="mt-1 font-mono text-primary-foreground/70">{r.invoiceNo}</div>
                    )}
                  </div>
                </div>

                {(r.previousTermEnd || r.newTermEnd) && (
                  <div className="mt-2 text-xs text-primary-foreground/70">
                    Hạn: <span className="font-mono">{r.previousTermEnd ?? "—"}</span> →{" "}
                    <span className="font-mono text-primary-foreground">{r.newTermEnd ?? "—"}</span>
                  </div>
                )}

                {r.eventType === "idempotent_noop" && typeof r.metadata?.reason === "string" && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary/80">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {r.metadata.reason === "renewed_today"
                      ? "Đã gia hạn hôm nay"
                      : r.metadata.reason === "already_paid_for_year"
                        ? `Đã có hóa đơn thanh toán cho năm ${
                            (r.metadata as any).target_year ?? ""
                          }`
                        : String(r.metadata.reason)}
                  </div>
                )}

                {r.eventType === "failure" && (r.errorCode || r.errorMessage) && (
                  <div className="mt-2 rounded-md bg-destructive/10 p-2 text-[11px] text-destructive">
                    <div className="font-medium">{r.errorCode ?? "Lỗi"}</div>
                    {r.errorMessage && (
                      <div className="mt-0.5 text-destructive/80">{r.errorMessage}</div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
