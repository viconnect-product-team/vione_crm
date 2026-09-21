// BC-2.2 — Layout-aware live preview for the Business Card builder.
// Presentation only: renders the current form state as a card, picking one of
// 5 layouts (classic / centered / sidebar / split / minimal) driven by the
// active template. No data access. Colors and fonts come from the template.
//
// Bilingual VI/EN: when any EN override is present the component renders a
// second face beneath the VI one. Both faces live in the same DOM, so any
// screenshot / html-to-image export captures both sides automatically.

import { resolveTheme } from "@/lib/business-card/business-card.share";
import { getTemplate } from "@/lib/card-templates";
import type { CardTemplate, CardLayout } from "@/lib/card-templates";
import { QrCanvas } from "@/components/member/QrCanvas";

/**
 * Presentation-only QR customisation. Not persisted — these live in the
 * builder's local state so the user can preview logo placement and background
 * without touching the saved card record.
 */
export type QrPreviewOptions = {
  /** "template" reuses `theme.surface`; "transparent" drops the plate. */
  background?: "white" | "template" | "transparent";
  /** Logo diameter as a fraction of QR size (0.14–0.30). */
  logoScale?: number;
  /** Horizontal logo offset (-0.25 to 0.25). */
  logoOffsetX?: number;
  /** Vertical logo offset (-0.25 to 0.25). */
  logoOffsetY?: number;
};

export type PreviewState = {
  displayName?: string | null;
  professionalTitle?: string | null;
  headline?: string | null;
  companyName?: string | null;
  bio?: string | null;
  displayNameEn?: string | null;
  professionalTitleEn?: string | null;
  headlineEn?: string | null;
  companyNameEn?: string | null;
  bioEn?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  themeId?: string | null;
  slug?: string | null;
  showContact: boolean;
  qrOptions?: QrPreviewOptions;
};

type FaceValues = {
  displayName: string | null;
  professionalTitle: string | null;
  headline: string | null;
  companyName: string | null;
  bio: string | null;
};

function hasAnyEn(s: PreviewState): boolean {
  return Boolean(
    (s.displayNameEn ?? "").trim() ||
    (s.professionalTitleEn ?? "").trim() ||
    (s.headlineEn ?? "").trim() ||
    (s.companyNameEn ?? "").trim() ||
    (s.bioEn ?? "").trim(),
  );
}

export function GlobalCardPreview({ state }: { state: PreviewState }) {
  const showEn = hasAnyEn(state);
  const viFace: FaceValues = {
    displayName: state.displayName ?? null,
    professionalTitle: state.professionalTitle ?? null,
    headline: state.headline ?? null,
    companyName: state.companyName ?? null,
    bio: state.bio ?? null,
  };
  // EN face: prefer EN value, fall back to VI so it never renders empty.
  const enFace: FaceValues = {
    displayName: (state.displayNameEn ?? "").trim() || state.displayName || null,
    professionalTitle: (state.professionalTitleEn ?? "").trim() || state.professionalTitle || null,
    headline: (state.headlineEn ?? "").trim() || state.headline || null,
    companyName: (state.companyNameEn ?? "").trim() || state.companyName || null,
    bio: (state.bioEn ?? "").trim() || state.bio || null,
  };

  return (
    <div className="space-y-3" data-card-bilingual={showEn ? "true" : "false"}>
      <CardFace state={state} values={viFace} sideLabel="VI" />
      {showEn && <CardFace state={state} values={enFace} sideLabel="EN" />}
    </div>
  );
}

function CardFace({
  state,
  values,
  sideLabel,
}: {
  state: PreviewState;
  values: FaceValues;
  sideLabel: "VI" | "EN";
}) {
  const theme = resolveTheme(state.themeId ?? null);
  const template = getTemplate(state.themeId ?? null);
  const layout: CardLayout = template?.layout ?? "classic";
  const initials = (values.displayName ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const headingFont = template?.headingFont ?? "Inter";
  const bodyFont = template?.bodyFont ?? "Inter";
  const style = {
    background: theme.surface,
    color: theme.text,
    borderColor: theme.border,
    fontFamily: `"${bodyFont}", ui-sans-serif, system-ui, sans-serif`,
  } as const;
  const h = {
    fontFamily: `"${headingFont}", ui-serif, Georgia, serif`,
    color: theme.text,
  };
  const muted = { color: theme.textMuted };
  const accent = { color: theme.accent };

  const AvatarBlock = (
    <div
      className="grid place-items-center rounded-2xl bg-foreground/20 border overflow-hidden"
      style={{ borderColor: theme.border }}
    >
      {state.avatarUrl ? (
        <img src={state.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-xl font-semibold" style={muted}>
          {initials}
        </span>
      )}
    </div>
  );

  const Contact = state.showContact ? (
    <div className="space-y-1 text-sm">
      {state.workPhone && <p>{state.workPhone}</p>}
      {state.workEmail && <p className="break-all">{state.workEmail}</p>}
      {state.website && (
        <p className="break-all" style={accent}>
          {state.website}
        </p>
      )}
    </div>
  ) : null;

  const Name = (
    <div>
      <h2 className="text-xl font-semibold leading-tight" style={h}>
        {values.displayName || "—"}
      </h2>
      {values.professionalTitle && (
        <p className="mt-0.5 text-sm" style={muted}>
          {values.professionalTitle}
        </p>
      )}
      {values.companyName && (
        <p className="text-sm" style={{ ...accent, fontWeight: 600 }}>
          {values.companyName}
        </p>
      )}
    </div>
  );

  const Copy = (
    <div className="space-y-2">
      {values.headline && (
        <p className="text-sm italic" style={muted}>
          {values.headline}
        </p>
      )}
      {values.bio && (
        <p className="text-sm line-clamp-4" style={muted}>
          {values.bio}
        </p>
      )}
    </div>
  );

  const qrUrl = state.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/b/${state.slug}${sideLabel === "EN" ? "?lang=en" : ""}`
    : null;

  const qrOpts = state.qrOptions ?? {};
  const qrBg =
    qrOpts.background === "transparent"
      ? "transparent"
      : qrOpts.background === "template"
        ? theme.surface
        : "#ffffff";
  const QrBadge = qrUrl ? (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10">
      <QrCanvas
        value={qrUrl}
        size={68}
        light={qrBg}
        dark="#0a1834"
        frameColor={qrBg}
        accent={theme.accent}
        logoUrl={state.avatarUrl ?? null}
        logoScale={qrOpts.logoScale ?? 0.22}
        logoOffsetX={qrOpts.logoOffsetX ?? 0}
        logoOffsetY={qrOpts.logoOffsetY ?? 0}
      />
    </div>
  ) : null;

  const SideBadge = (
    <div
      className="pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: theme.accent,
        color: theme.surface,
        opacity: 0.85,
      }}
      aria-label={sideLabel === "VI" ? "Mặt tiếng Việt" : "English side"}
    >
      {sideLabel}
    </div>
  );

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
      className="relative rounded-2xl border shadow-lg overflow-hidden"
      style={style}
      data-card-layout={layout}
      data-card-template={template?.id ?? "classic"}
      data-card-side={sideLabel}
    >
      <Motif template={template} />
      {SideBadge}
      <div className="relative">{children}</div>
      {QrBadge}
    </div>
  );

  if (layout === "centered") {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
          <div className="size-20">{AvatarBlock}</div>
          <div className="h-px w-12" style={{ backgroundColor: theme.accent, opacity: 0.7 }} />
          {Name}
          {Copy}
          {Contact}
        </div>
      </Shell>
    );
  }

  if (layout === "sidebar") {
    return (
      <Shell>
        <div className="grid grid-cols-[104px_1fr] min-h-[240px]">
          <div
            className="flex flex-col items-center justify-between p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          >
            <div className="size-16">{AvatarBlock}</div>
            <div className="w-8 h-0.5" style={{ backgroundColor: theme.accent }} />
          </div>
          <div className="p-5 space-y-3">
            {Name}
            {Copy}
            {Contact}
          </div>
        </div>
      </Shell>
    );
  }

  if (layout === "split") {
    return (
      <Shell>
        <div className="grid grid-cols-2">
          <div className="p-5 space-y-3" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
            <div className="size-16">{AvatarBlock}</div>
            {Name}
          </div>
          <div className="p-5 space-y-3 border-l" style={{ borderColor: theme.border }}>
            {Copy}
            {Contact}
          </div>
        </div>
      </Shell>
    );
  }

  if (layout === "minimal") {
    return (
      <Shell>
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">{Name}</div>
            <div className="size-14">{AvatarBlock}</div>
          </div>
          <div className="h-px w-full" style={{ backgroundColor: theme.accent, opacity: 0.4 }} />
          {Copy}
          {Contact}
        </div>
      </Shell>
    );
  }

  // classic
  return (
    <Shell>
      <div
        className="h-16 w-full"
        style={{ backgroundColor: theme.accent, opacity: 0.25 }}
        aria-hidden
      />
      <div className="px-5 pb-5 -mt-10 space-y-3">
        <div className="size-20">{AvatarBlock}</div>
        {Name}
        {Copy}
        {Contact}
      </div>
    </Shell>
  );
}

function Motif({ template }: { template: CardTemplate | null }) {
  if (!template || !template.motif || template.motif === "none") return null;
  const { motif, accent } = template;
  const common = "pointer-events-none absolute inset-0 opacity-[0.08]";
  if (motif === "grid") {
    return (
      <div
        className={common}
        style={{
          backgroundImage: `linear-gradient(${accent} 1px,transparent 1px),linear-gradient(90deg,${accent} 1px,transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
    );
  }
  if (motif === "diagonal") {
    return (
      <div
        className={common}
        style={{
          backgroundImage: `repeating-linear-gradient(45deg,${accent} 0 1px,transparent 1px 12px)`,
        }}
        aria-hidden
      />
    );
  }
  if (motif === "hairline") {
    return (
      <div
        className="pointer-events-none absolute inset-x-4 top-4 h-px"
        style={{ backgroundColor: accent, opacity: 0.35 }}
        aria-hidden
      />
    );
  }
  if (motif === "dot") {
    return (
      <div
        className={common}
        style={{
          backgroundImage: `radial-gradient(${accent} 1px,transparent 1px)`,
          backgroundSize: "14px 14px",
        }}
        aria-hidden
      />
    );
  }
  if (motif === "arc") {
    return (
      <svg
        className="pointer-events-none absolute -right-16 -top-16 opacity-20"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        aria-hidden
      >
        <circle cx="110" cy="110" r="90" fill="none" stroke={accent} strokeWidth="1" />
        <circle cx="110" cy="110" r="60" fill="none" stroke={accent} strokeWidth="1" />
      </svg>
    );
  }
  return null;
}
