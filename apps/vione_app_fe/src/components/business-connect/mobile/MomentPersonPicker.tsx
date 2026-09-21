// BC-Mobile-2E — Moment person picker.
//
// Reuses the FROZEN 2A Network composition (accepted connections ∪ owner's
// non-archived saved cards, viewer-scoped). Selecting a person opens the
// composer at /connect-app/moment/$personId. Every person listed here is
// already authorized for moments by construction (the 2A inclusion rule is
// exactly the moment authorization rule).

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, RefreshCw, Search, Sparkles, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  useBusinessConnectNetwork,
  type BcMobileNetworkPerson,
} from "@/hooks/use-business-connect-network";
import { MobilePage } from "./MobilePage";
import { BusinessConnectTopBar } from "./BusinessConnectTopBar";
import { MobileSearchBar } from "./MobileSearchBar";

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function PickerRow({ person }: { person: BcMobileNetworkPerson }) {
  const t = useT();
  const name = person.displayName ?? t("bc.mobile.network.unknownPerson");
  const subtitle = [person.headline, person.companyName].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        to="/connect-app/moment/$personId"
        params={{ personId: person.personId }}
        aria-label={t("bc.mobile.moment.composer.subtitle", { name })}
        className="flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt=""
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[15px] font-semibold text-[var(--bc-mobile-text)]"
          >
            {initialsOf(person.displayName)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
            {name}
          </span>
          {subtitle ? (
            <span className="block truncate text-[13px] text-[var(--bc-mobile-muted)]">
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
        />
      </Link>
    </li>
  );
}

export function MomentPersonPicker() {
  const t = useT();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const net = useBusinessConnectNetwork(searchTerm);

  return (
    <MobilePage>
      <BusinessConnectTopBar back onBack={() => navigate({ to: "/connect-app" })} />
      <main id="bc-mobile-moment-picker" className="mt-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.moment.picker.title")}
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.moment.picker.subtitle")}
        </p>

        <div className="mt-5">
          <MobileSearchBar
            id="bc-moment-person-search"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t("bc.mobile.network.search.placeholder")}
          />
        </div>

        {/* Tùy chọn Đăng khoảnh khắc chung / Cá nhân (luôn khả dụng) */}
        <div className="mt-4">
          <Link
            to="/connect-app/moment/$personId"
            params={{ personId: "general" }}
            className="flex items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border-gold)] bg-gradient-to-r from-[var(--bc-mobile-surface)] to-[var(--bc-mobile-surface-2)] p-3.5 text-left transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#D8B282] to-[#F6E1C3] text-slate-950 shadow-md">
              <Sparkles className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-[var(--bc-mobile-text)]">
                Đăng khoảnh khắc chung / Sự kiện của tôi
              </span>
              <span className="block text-[13px] text-[var(--bc-mobile-muted)]">
                Lưu bài học, sự kiện doanh nghiệp không giới hạn đối tác
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--bc-mobile-accent)]" />
          </Link>
        </div>

        {net.initialLoading ? (
          <div aria-busy="true" className="mt-6 space-y-3">
            <span className="sr-only">{t("bc.mobile.network.loading")}</span>
            {[0, 1, 2].map((i) => (
              <div key={i} aria-hidden="true" className="flex items-center gap-3.5 px-2">
                <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/5 animate-pulse rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                  <div className="h-3 w-3/5 animate-pulse rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        ) : net.coreError ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-[15px] font-medium text-[var(--bc-mobile-text)]">
              {t("bc.mobile.network.error")}
            </p>
            <button
              type="button"
              onClick={net.retry}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.network.retry")}
            </button>
          </div>
        ) : net.people.length === 0 ? (
          <div className="mt-10 flex flex-col items-center px-4 text-center">
            <span
              aria-hidden="true"
              className="grid h-16 w-16 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)] ring-1 ring-[var(--bc-mobile-border-gold)]"
            >
              <UserRound className="h-8 w-8" strokeWidth={1.6} />
            </span>
            <p className="mt-4 max-w-[34ch] text-[14px] font-medium leading-relaxed text-[var(--bc-mobile-text)]">
              {net.searching
                ? t("bc.mobile.moment.picker.searchEmpty")
                : "Bạn chưa có kết nối nào trong danh bạ nhưng vẫn có thể tự do đăng khoảnh khắc ngay!"}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
              <Link
                to="/connect-app/moment/$personId"
                params={{ personId: "general" }}
                className="w-full py-3 px-5 rounded-full font-bold text-[14px] text-center bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-md hover:brightness-105 active:scale-95 transition-all"
              >
                Đăng Khoảnh Khắc Ngay
              </Link>
              <Link
                to="/connect-app/card-scan"
                className="w-full py-3 px-5 rounded-full font-semibold text-[13.5px] text-center border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors"
              >
                Quét Danh Thiếp / Thêm Đối Tác
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-1 border-t border-[var(--bc-mobile-border)] pt-3">
              {net.people.map((p) => (
                <PickerRow key={p.personId} person={p} />
              ))}
            </ul>
            {net.hasMore ? (
              <button
                type="button"
                onClick={net.loadMore}
                disabled={net.isLoadingMore}
                className="mt-4 w-full min-h-11 rounded-full border border-[var(--bc-mobile-border)] text-[14px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
              >
                {net.isLoadingMore
                  ? t("bc.mobile.network.loading")
                  : t("bc.mobile.network.loadMore")}
              </button>
            ) : null}
          </>
        )}
      </main>
    </MobilePage>
  );
}
