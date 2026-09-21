// BC-Mobile-5A — Identity Hero for the Me tab.
// Renders the OWNER'S full identity (never the public projection): avatar or
// initials, display name, headline, job title · company, and a calm
// completeness meter with a single "complete your profile" hint.

import { ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { identityCompleteness } from "@/lib/business-connect/mobile/identity.projection";
import type { BusinessIdentity } from "@/lib/business-connect/mobile/identity.types";

function initialsOf(name: string | null, emailFallback: string | null): string {
  const source = (name ?? "").trim() || (emailFallback ?? "");
  const parts = source.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return "…";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function IdentityHero({
  identity,
  email,
  onEdit,
}: {
  identity: BusinessIdentity | null;
  email: string | null;
  onEdit: () => void;
}) {
  const t = useT();
  const { percent } = identity ? identityCompleteness(identity) : { percent: 0 };
  const displayName = identity?.displayName?.trim() || email || t("bc.mobile.me.emptyName");
  const subtitle = [identity?.jobTitle, identity?.companyName].filter(Boolean).join(" · ");

  return (
    <section
      aria-labelledby="me-identity-hero-title"
      className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 shadow-[var(--bc-mobile-shadow-v)]"
    >
      <div className="flex items-center gap-4">
        {identity?.avatarUrl ? (
          <img
            src={identity.avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)]"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-navy)] text-[19px] font-semibold text-[var(--bc-mobile-accent)]"
          >
            {initialsOf(identity?.displayName ?? null, email)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1
            id="me-identity-hero-title"
            className="break-words text-[22px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]"
          >
            {displayName}
          </h1>
          {subtitle && (
            <p className="mt-0.5 break-words text-[13.5px] text-[var(--bc-mobile-muted)]">
              {subtitle}
            </p>
          )}
          {identity?.headline && (
            <p className="mt-1 line-clamp-2 break-words text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
              {identity.headline}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[12.5px] font-medium text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.me.completeness")}
          </p>
          <p className="text-[12.5px] font-semibold tabular-nums text-[var(--bc-mobile-text)]">
            {percent}%
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={t("bc.mobile.me.completeness")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bc-mobile-surface-2)]"
        >
          <div
            className="h-full rounded-full bg-[var(--bc-mobile-navy)] transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        {percent < 100 && (
          <p className="mt-2 text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.me.emptyIdentity")}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-[var(--bc-mobile-surface-2)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-border)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        {t("bc.mobile.me.edit")}
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
        />
      </button>
    </section>
  );
}
