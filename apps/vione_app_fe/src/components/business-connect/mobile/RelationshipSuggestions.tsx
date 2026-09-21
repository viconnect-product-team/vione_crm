// BC-Mobile-6A — Home "V · Gợi ý hôm nay" section.
//
// Calm Executive Minimal: hairline rows, no cards, no scores. At most
// MAX_HOME_RECOMMENDATIONS rows, each with ONE reason. Tapping a row opens
// Person Detail; the quiet ✕ dismisses (snooze). Own query — Home never
// blocks on intelligence; errors collapse to a quiet inline retry.

import { Link } from "@tanstack/react-router";
import { ChevronRight, RefreshCw, X } from "lucide-react";
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
    <li className="relative min-w-0 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3 shadow-xs">
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
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[14px] font-semibold text-[var(--bc-mobile-text)] ring-1 ring-[var(--bc-mobile-border)]"
            >
              {initialsOf(rec.person.displayName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
              {name}
            </span>
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--bc-mobile-text)]">
              {suggestionText}
            </p>
            <p className="mt-1 text-[11.5px] text-[var(--bc-mobile-accent)]">
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

type DistanceFilter = "all" | "near" | "far";

const CHIP_BASE =
  "inline-flex h-8 w-[114px] min-w-[114px] max-w-[114px] items-center justify-center rounded-full border px-2 text-[12px] font-medium transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap text-center leading-none";

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
          ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] font-semibold border-transparent shadow-[0_2px_10px_rgba(201,158,74,0.35)]"
          : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]/60 text-[var(--bc-mobile-muted)] hover:border-[#D8B282]/50 hover:text-[var(--bc-mobile-text)]"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

export function RelationshipSuggestions() {
  const t = useT();
  const { lang } = useLang();
  const { recommendations, initialLoading, error, retry } =
    useTodayRelationshipRecommendations(lang);
  const dismiss = useDismissRelationshipRecommendation();

  // Viewer area (own identity city) — powers the truthful "near me" filter.
  // Uses fetchNestApi directly (bypass requireSupabaseAuth middleware).
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

  const industries = useMemo(() => {
    const seen = new Map<string, string>();
    for (const rec of recommendations) {
      const label = rec.person.industryLabel?.trim();
      if (label) seen.set(label.toLowerCase(), label);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, lang));
  }, [recommendations, lang]);

  const filtered = useMemo(
    () =>
      recommendations.filter((rec) => {
        if (industry !== "all") {
          if ((rec.person.industryLabel ?? "").toLowerCase() !== industry) return false;
        }
        if (distance !== "all") {
          if (!viewerArea) return true;
          const area = normalizeArea(rec.person.areaLabel);
          if (!area) return false;
          const near = area === viewerArea;
          if (distance === "near" && !near) return false;
          if (distance === "far" && near) return false;
        }
        return true;
      }),
    [recommendations, industry, distance, viewerArea],
  );

  const showFilters = recommendations.length > 0 && (industries.length > 0 || Boolean(viewerArea));

  useEffect(() => {
    if (recommendations.length > 0) {
      trackRelationshipIntel("RELATIONSHIP_RECOMMENDATION_RENDERED", {
        surface: "home",
        count: recommendations.length,
      });
    }
  }, [recommendations.length]);

  const onDismiss = (rec: RelationshipRecommendation) => {
    // 6C: coarse behavioral signal; the 6A snooze mutation stays authoritative.
    recordIntelInteraction("recommendation_dismissed", "reconnect");
    dismiss.mutate(
      { personId: rec.person.personId, type: "reconnect" },
      {
        onSuccess: () => toast.success(t("bc.mobile.intel.dismiss.done")),
        onError: () => toast.error(t("bc.mobile.intel.error")),
      },
    );
  };

  if (error) {
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

  if (initialLoading) {
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

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2
        id="bc-rel-intel-title"
        className="text-xs font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
      >
        {t("bc.mobile.intel.home.title")}
      </h2>
      <Link
        to="/connect-app/network"
        search={{ tab: "suggestions" } as any}
        className="inline-flex h-7 px-2.5 rounded-full items-center gap-1.5 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] active:border-[var(--bc-mobile-border-active)] transition-all cursor-pointer shrink-0"
      >
        <span>{t("bc.mobile.intel.home.viewAll")}</span>
        {recommendations.length > 0 ? (
          <span className="rounded-full bg-[var(--bc-mobile-accent-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--bc-mobile-accent)] leading-none">
            {recommendations.length}
          </span>
        ) : null}
        <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--bc-mobile-accent)]" strokeWidth={2} />
      </Link>
    </div>
  );

  if (recommendations.length === 0) {
    return null;
  }

  const displayedList = expandedAll ? filtered : filtered.slice(0, 3);

  return (
    <section aria-labelledby="bc-rel-intel-title" className="mt-6">
      {header}
      {showFilters ? (
        <div role="group" aria-label={t("bc.mobile.intel.filter.label")} className="mt-2.5 space-y-2">
          {industries.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 w-[96px] text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.intel.filter.industry")}
              </span>
              <FilterChip
                active={industry === "all"}
                label={t("bc.mobile.intel.filter.industry.all")}
                onClick={() => setIndustry("all")}
              />
              {industries.map((label) => (
                <FilterChip
                  key={label}
                  active={industry === label.toLowerCase()}
                  label={label}
                  onClick={() => setIndustry(label.toLowerCase())}
                />
              ))}
            </div>
          ) : null}
          {viewerArea ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 w-[96px] text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.intel.filter.distance")}
              </span>
              {(["all", "near", "far"] as const).map((value) => (
                <FilterChip
                  key={value}
                  active={distance === value}
                  label={t(
                    value === "all"
                      ? "bc.mobile.intel.filter.distance.all"
                      : value === "near"
                        ? "bc.mobile.intel.filter.distance.near"
                        : "bc.mobile.intel.filter.distance.far",
                  )}
                  onClick={() => setDistance(value)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <div className="mt-3 flex items-center gap-3">
          <p className="text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.intel.filter.empty")}
          </p>
          <button
            type="button"
            onClick={() => {
              setIndustry("all");
              setDistance("all");
            }}
            className={`inline-flex min-h-[44px] items-center rounded-lg px-2 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
          >
            {t("bc.mobile.intel.filter.reset")}
          </button>
        </div>
      ) : null}
      <ul aria-label={t("bc.mobile.intel.list.label")} className="mt-3 space-y-2.5">
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
