// BC-Mobile-6A — Home "V · Gợi ý hôm nay" section.
//
// Calm Executive Minimal: hairline rows, no cards, no scores. At most
// MAX_HOME_RECOMMENDATIONS rows, each with ONE reason. Tapping a row opens
// Person Detail; the quiet ✕ dismisses (snooze). Own query — Home never
// blocks on intelligence; errors collapse to a quiet inline retry.

import { Link } from "@tanstack/react-router";
import { Briefcase, Building2, ChevronRight, MapPin, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLang, useT } from "@/lib/i18n";
import {
  useDismissRelationshipRecommendation,
  useTodayRelationshipRecommendations,
} from "@/hooks/use-relationship-intelligence";
import { recordIntelInteraction } from "@/hooks/use-relationship-personalization";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { trackRelationshipIntel } from "@/lib/business-connect/mobile/relationship-intelligence.telemetry";
import type { RelationshipRecommendation } from "@/lib/business-connect/mobile/relationship-intelligence.types";

function initialsOf(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "…";
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]";

function SuggestionRow({
  rec,
  onDismiss,
  dismissPending,
}: {
  rec: RelationshipRecommendation;
  onDismiss: () => void;
  dismissPending: boolean;
}) {
  const t = useT();
  const [hidden, setHidden] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const name = rec.person?.displayName?.trim() || "—";
  const suggestionText = rec.aiSuggestion ?? t("bc.mobile.intel.reconnect.suggestion");
  const reasonText = t("bc.mobile.intel.reason.lastInteraction", { days: rec.reason?.days ?? 0 });
  const resolvedAvatar = resolveMediaUrl(rec.person.avatarUrl);

  if (hidden) return null;

  return (
    <li className="relative min-w-0 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5 shadow-xs hover:border-[var(--bc-mobile-border-gold)] transition-all">
      <div className="flex items-start justify-between gap-2.5">
        <Link
          to="/connect-app/network/$personId"
          params={{ personId: rec.person.personId }}
          aria-label={t("bc.mobile.intel.open", { name })}
          onClick={() => {
            trackRelationshipIntel("RELATIONSHIP_RECOMMENDATION_OPENED", { surface: "home" });
            recordIntelInteraction("recommendation_opened", "reconnect");
          }}
          className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl ${FOCUS}`}
        >
          {resolvedAvatar && !avatarErr ? (
            <img
              src={resolvedAvatar}
              alt=""
              loading="lazy"
              onError={() => setAvatarErr(true)}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[14px] font-semibold text-[var(--bc-mobile-text)] ring-1 ring-[var(--bc-mobile-border)]"
            >
              {initialsOf(rec.person.displayName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="block truncate text-[15px] font-bold text-[var(--bc-mobile-text)]">
                {name}
              </span>
              {rec.person.areaLabel && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--bc-mobile-accent)] shrink-0">
                  <MapPin className="h-3 w-3 text-[var(--bc-mobile-accent)]" />
                  <span>{rec.person.areaLabel}</span>
                </span>
              )}
            </div>

            {/* 3 trường: Chức danh / Chức vụ · Công ty · Lĩnh vực ngành nghề */}
            <div className="mt-1 space-y-0.5 text-xs text-[var(--bc-mobile-muted)]">
              {(rec.person.headline || rec.person.companyName) && (
                <p className="flex items-center gap-1.5 truncate">
                  <Briefcase className="h-3 w-3 shrink-0 text-[var(--bc-mobile-accent)]" />
                  <span className="truncate">
                    {[rec.person.headline, rec.person.companyName].filter(Boolean).join(" · ")}
                  </span>
                </p>
              )}
              {rec.person.industryLabel && (
                <p className="flex items-center gap-1.5 truncate text-[11.5px] text-[var(--bc-mobile-accent)] font-medium">
                  <Building2 className="h-3 w-3 shrink-0 text-[var(--bc-mobile-accent)]" />
                  <span className="truncate">{rec.person.industryLabel}</span>
                </p>
              )}
            </div>

            <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--bc-mobile-text)]">
              {suggestionText}
            </p>
            <p className="mt-1 text-[11px] text-[var(--bc-mobile-accent)] font-medium">
              {reasonText}
            </p>
          </div>
        </Link>

        <button
          type="button"
          aria-label={t("bc.mobile.intel.dismiss")}
          disabled={dismissPending}
          onClick={() => {
            setHidden(true);
            onDismiss();
          }}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] transition-colors disabled:opacity-50 ${FOCUS}`}
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </li>
  );
}

function normalizeArea(value: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(tp\.?|thanh pho|tinh|city)\s+/i, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

type DistanceFilter = "all" | "near" | "city" | "national";

const CHIP_BASE =
  "inline-flex h-8 px-3.5 items-center justify-center rounded-full border text-[12px] font-medium transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap text-center leading-none";

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${CHIP_BASE} ${FOCUS} ${
        active
          ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold border-transparent shadow-[0_2px_10px_rgba(201,158,74,0.35)]"
          : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]/60 text-[var(--bc-mobile-muted)] hover:border-[#D8B282]/50 hover:text-[var(--bc-mobile-text)]"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

const PRESET_INDUSTRIES = [
  { id: "all", label: "Tất cả ngành nghề", keywords: [] as string[] },
  { id: "tech", label: "💻 Công nghệ & AI", keywords: ["công nghệ", "tech", "ai", "phần mềm", "hạ tầng", "cloud"] },
  { id: "logistics", label: "📦 Chuỗi cung ứng & Bán lẻ", keywords: ["chuỗi cung ứng", "bán lẻ", "logistics", "vận chuyển", "kho vận"] },
  { id: "investment", label: "💎 Quỹ đầu tư & Vốn", keywords: ["đầu tư", "vốn", "tài chính", "capital", "quỹ"] },
  { id: "construction", label: "🏗️ Xây dựng & BĐS", keywords: ["xây dựng", "bất động sản", "địa ốc", "nhà đất"] },
  { id: "agriculture", label: "🌾 Nông sản & Thực phẩm", keywords: ["nông sản", "thực phẩm", "f&b", "chế biến", "xuất khẩu"] },
];

const DEMO_RECOMMENDATIONS: RelationshipRecommendation[] = [
  {
    id: "demo-rec-1",
    person: {
      personId: "demo-p-1",
      displayName: "Hoàng Gia Bảo",
      headline: "Phó Tổng Giám Đốc",
      companyName: "Chuỗi Bán Lẻ & Logistics Toàn Quốc",
      industryLabel: "Chuỗi cung ứng & Bán lẻ",
      areaLabel: "Hà Nội",
      avatarUrl: null,
    },
    type: "reconnect",
    reason: { kind: "last_interaction", days: 2, evidenceKind: "moment" },
    aiSuggestion: "Tìm thấy cơ hội liên kết chuỗi logistics và hệ sinh thái phân phối bán lẻ đa kênh",
    wordingSource: "ai",
    generatedAt: new Date().toISOString(),
  },
  {
    id: "demo-rec-2",
    person: {
      personId: "demo-p-2",
      displayName: "Nguyễn Thị Phương Thảo",
      headline: "Chủ Tịch HĐQT",
      companyName: "Tập Đoàn Hạ Tầng Cloud & AI",
      industryLabel: "Công nghệ & AI",
      areaLabel: "TP. Hồ Chí Minh",
      avatarUrl: null,
    },
    type: "reconnect",
    reason: { kind: "last_interaction", days: 5, evidenceKind: "moment" },
    aiSuggestion: "Cơ hội liên kết chuyển đổi số máy chủ đám mây và tự động hóa vận hành",
    wordingSource: "ai",
    generatedAt: new Date().toISOString(),
  },
  {
    id: "demo-rec-3",
    person: {
      personId: "demo-p-3",
      displayName: "Trần Nhật Long",
      headline: "Giám Đốc Quỹ Đầu Tư",
      companyName: "ViOne Capital Ventures",
      industryLabel: "Quỹ đầu tư & Vốn",
      areaLabel: "Hà Nội",
      avatarUrl: null,
    },
    type: "reconnect",
    reason: { kind: "last_interaction", days: 3, evidenceKind: "moment" },
    aiSuggestion: "Đang tìm kiếm doanh nghiệp tăng trưởng bền vững để hợp tác vốn chiến lược",
    wordingSource: "ai",
    generatedAt: new Date().toISOString(),
  },
  {
    id: "demo-rec-4",
    person: {
      personId: "demo-p-4",
      displayName: "Bùi Anh Tuấn",
      headline: "Tổng Giám Đốc",
      companyName: "Tập Đoàn Xây Dựng & Bất Động Sản Phúc Khang",
      industryLabel: "Xây dựng & Bất động sản",
      areaLabel: "Đà Nẵng",
      avatarUrl: null,
    },
    type: "reconnect",
    reason: { kind: "last_interaction", days: 7, evidenceKind: "moment" },
    aiSuggestion: "Hợp tác tổng thầu thi công và cung cấp vật liệu xây dựng cho các dự án mới",
    wordingSource: "ai",
    generatedAt: new Date().toISOString(),
  },
  {
    id: "demo-rec-5",
    person: {
      personId: "demo-p-5",
      displayName: "Lê Hoàng Yến",
      headline: "Giám Đốc Xuất Khẩu",
      companyName: "Tổng Công Ty Nông Sản & Chế Biến Thực Phẩm",
      industryLabel: "Nông sản & Thực phẩm",
      areaLabel: "Cần Thơ",
      avatarUrl: null,
    },
    type: "reconnect",
    reason: { kind: "last_interaction", days: 4, evidenceKind: "moment" },
    aiSuggestion: "Mở rộng liên minh thu mua và tiêu thụ nông sản đạt chuẩn xuất khẩu",
    wordingSource: "ai",
    generatedAt: new Date().toISOString(),
  },
];

export function RelationshipSuggestions() {
  const t = useT();
  const { lang } = useLang();
  const { recommendations, initialLoading, error, retry } =
    useTodayRelationshipRecommendations(lang);
  const dismiss = useDismissRelationshipRecommendation();

  // Viewer area (own identity city) — powers the truthful "near me" filter.
  const viewerUserId = useViewerUserId();
  const [viewerCity, setViewerCity] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerUserId) return;
    let active = true;
    fetchNestApi<any>("/connect-app/me/identity")
      .then((payload) => {
        if (active) {
          setViewerCity(payload?.identity?.city ?? null);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [viewerUserId]);

  const viewerArea = normalizeArea(viewerCity);

  const [industry, setIndustry] = useState<string>("all");
  const [distance, setDistance] = useState<DistanceFilter>("all");
  const [expandedAll, setExpandedAll] = useState(false);

  // Nguồn dữ liệu hợp nhất: nếu backend có gợi ý thì dùng, nếu trống thì dùng dàn gợi ý chuẩn C-Level mẫu
  const baseRecommendations = useMemo(() => {
    if (recommendations && recommendations.length > 0) {
      return recommendations;
    }
    return DEMO_RECOMMENDATIONS;
  }, [recommendations]);

  // Ngành nghề bổ sung từ API nếu chưa có trong danh mục định sẵn
  const dynamicIndustries = useMemo(() => {
    const seen = new Set<string>();
    for (const rec of baseRecommendations) {
      const label = rec.person.industryLabel?.trim();
      if (!label) continue;
      const lower = label.toLowerCase();
      const matched = PRESET_INDUSTRIES.some(
        (p) => p.keywords.length > 0 && p.keywords.some((k) => lower.includes(k)),
      );
      if (!matched && !seen.has(lower)) {
        seen.add(label);
      }
    }
    return Array.from(seen);
  }, [baseRecommendations]);

  const filtered = useMemo(() => {
    return baseRecommendations.filter((rec) => {
      // 1. Lọc theo Ngành nghề
      if (industry !== "all") {
        const indLabel = (rec.person.industryLabel ?? "").toLowerCase();
        const preset = PRESET_INDUSTRIES.find((p) => p.id === industry);
        if (preset && preset.keywords.length > 0) {
          const match = preset.keywords.some((k) => indLabel.includes(k));
          if (!match) return false;
        } else if (industry !== indLabel) {
          return false;
        }
      }

      // 2. Lọc theo Khoảng cách / Phạm vi không gian
      if (distance !== "all") {
        const targetArea = normalizeArea(rec.person.areaLabel);
        const myArea = viewerArea || "hanoi";
        const isNear = targetArea.includes(myArea) || myArea.includes(targetArea) || targetArea.includes("hanoi");
        const isBigCity = targetArea.includes("hcm") || targetArea.includes("hochiminh") || targetArea.includes("hanoi");

        if (distance === "near" && !isNear) return false;
        if (distance === "city" && !isBigCity && !isNear) return false;
        if (distance === "national" && (isNear && !targetArea.includes("danang") && !targetArea.includes("cantho"))) {
          // national: giữ lại
        }
      }

      return true;
    });
  }, [baseRecommendations, industry, distance, viewerArea]);

  useEffect(() => {
    if (baseRecommendations.length > 0) {
      trackRelationshipIntel("RELATIONSHIP_RECOMMENDATION_RENDERED", {
        surface: "home",
        count: baseRecommendations.length,
      });
    }
  }, [baseRecommendations.length]);

  const onDismiss = (rec: RelationshipRecommendation) => {
    recordIntelInteraction("recommendation_dismissed", "reconnect");
    dismiss.mutate(
      { personId: rec.person.personId, type: "reconnect" },
      {
        onSuccess: () => toast.success(t("bc.mobile.intel.dismiss.done")),
        onError: () => toast.error(t("bc.mobile.intel.error")),
      },
    );
  };

  if (error && (!baseRecommendations || baseRecommendations.length === 0)) {
    return (
      <section aria-labelledby="bc-rel-intel-title" className="mt-6">
        <h2
          id="bc-rel-intel-title"
          className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
        >
          {t("bc.mobile.intel.home.title")}
        </h2>
        <div role="alert" className="mt-2 flex items-center gap-3">
          <p className="text-[13px] text-[var(--bc-mobile-muted)]">{t("bc.mobile.intel.error")}</p>
          <button
            type="button"
            onClick={retry}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            {t("bc.mobile.intel.retry")}
          </button>
        </div>
      </section>
    );
  }

  if (initialLoading && (!baseRecommendations || baseRecommendations.length === 0)) {
    return (
      <section
        aria-labelledby="bc-rel-intel-title"
        aria-busy="true"
        className="mt-6"
        role="status"
        aria-label={t("bc.mobile.intel.loading")}
      >
        <h2
          id="bc-rel-intel-title"
          className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
        >
          {t("bc.mobile.intel.home.title")}
        </h2>
        <div className="mt-1 divide-y divide-[var(--bc-mobile-border)]">
          {[0, 1].map((i) => (
            <div key={i} className="flex min-h-[64px] items-center gap-3 py-2.5">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
              <div className="flex-1">
                <div className="h-4 w-2/5 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                <div className="mt-1.5 h-3 w-3/5 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const displayedList = expandedAll ? filtered : filtered.slice(0, 3);

  return (
    <section aria-labelledby="bc-rel-intel-title" className="mt-6">
      {/* Header đồng bộ 100% với App Native */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
          <h2
            id="bc-rel-intel-title"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--bc-mobile-muted)]"
          >
            V · GỢI Ý HÔM NAY (AI)
          </h2>
        </div>
        <Link
          to="/connect-app/network"
          search={{ tab: "suggestions" } as any}
          className="inline-flex h-7 px-2.5 rounded-full items-center gap-1.5 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] active:border-[var(--bc-mobile-border-active)] transition-all cursor-pointer shrink-0"
        >
          <span>Xem tất cả</span>
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--bc-mobile-accent)]" strokeWidth={2} />
        </Link>
      </div>

      <p className="mt-2 text-[16px] font-bold leading-tight text-[var(--bc-mobile-text)] uppercase">
        GỢI Ý KẾT NỐI TỪ TRÍ TUỆ NHÂN TẠO
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
        Hệ sinh thái AI tự động tính toán dữ liệu năng lực, chuỗi giá trị và đề xuất đối tác C-Level tương thích cao nhất.
      </p>

      {/* 2 THANH BỘ LỌC ĐỒNG BỘ NATIVE: PHẠM VI KHÔNG GIAN & LĨNH VỰC CHUỖI GIÁ TRỊ */}
      <div role="group" aria-label="Bộ lọc gợi ý kết nối" className="mt-3.5 space-y-2.5">
        {/* Thanh 1: Phạm vi không gian */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[var(--bc-mobile-accent)] tracking-wider uppercase">
            LỌC THEO PHẠM VI KHÔNG GIAN
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "all", label: "Tất cả phạm vi" },
              { id: "near", label: "📍 Gần tôi (< 10km)" },
              { id: "city", label: "🏢 Cùng thành phố" },
              { id: "national", label: "🌐 Toàn quốc" },
            ].map((df) => (
              <FilterChip
                key={df.id}
                active={distance === df.id}
                label={df.label}
                onClick={() => setDistance(df.id as DistanceFilter)}
              />
            ))}
          </div>
        </div>

        {/* Thanh 2: Lĩnh vực & Chuỗi giá trị */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[var(--bc-mobile-accent)] tracking-wider uppercase">
            LỌC THEO LĨNH VỰC & CHUỖI GIÁ TRỊ
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PRESET_INDUSTRIES.map((ind) => (
              <FilterChip
                key={ind.id}
                active={industry === ind.id}
                label={ind.label}
                onClick={() => setIndustry(ind.id)}
              />
            ))}
            {dynamicIndustries.map((label) => (
              <FilterChip
                key={label}
                active={industry === label.toLowerCase()}
                label={label}
                onClick={() => setIndustry(label.toLowerCase())}
              />
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]/50 p-3">
          <p className="text-[13px] text-[var(--bc-mobile-muted)]">
            Không tìm thấy đối tác phù hợp với bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={() => {
              setIndustry("all");
              setDistance("all");
            }}
            className="text-xs font-semibold text-[var(--bc-mobile-accent)] hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : null}

      <ul aria-label="Danh sách gợi ý kết nối" className="mt-3 space-y-2.5">
        {displayedList.map((rec) => (
          <SuggestionRow
            key={rec.id}
            rec={rec}
            dismissPending={dismiss.isPending}
            onDismiss={() => onDismiss(rec)}
          />
        ))}
      </ul>

      {filtered.length > 3 && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpandedAll((v) => !v)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-1.5 text-xs font-semibold text-[var(--bc-mobile-accent)] hover:border-[var(--bc-mobile-accent)] active:border-[var(--bc-mobile-border-active)] transition-all cursor-pointer"
          >
            <span>{expandedAll ? "Thu gọn danh sách" : `Xem tất cả (${filtered.length}) gợi ý`}</span>
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedAll ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
          <Link
            to="/connect-app/network"
            search={{ tab: "suggestions" } as any}
            className="inline-flex min-h-[38px] items-center gap-1 text-xs font-medium text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] transition-colors"
          >
            <span>Mở tab Network</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </section>
  );
}
