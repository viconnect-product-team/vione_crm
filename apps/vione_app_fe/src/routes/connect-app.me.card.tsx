// BC-Mobile-3A — /connect-app/me/card: Present QR.
//
// The owner-facing outbound card experience: pick a persona (published
// business card), present its QR encoding the CANONICAL public URL
// (<origin>/b/<slug>) so a guest scanning it lands on the public digital
// card — never on a private record. Truthful states: unpublished cards are
// selectable but clearly flagged; owners with no cards get a create CTA.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Plus, Star, Edit3 } from "lucide-react";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { QrCanvas } from "@/components/member/QrCanvas";
import { BusinessCardSDK } from "@/lib/business-card";
import { useMyIdentity } from "@/hooks/use-my-identity";
import type { BusinessCardSummary } from "@/lib/business-card/business-card.types";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/connect-app/me/card")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Đưa QR — Business Connect" },
      {
        name: "description",
        content: "Trình bày mã QR danh thiếp số để người khác quét và lưu liên hệ của bạn.",
      },
      { property: "og:title", content: "Đưa QR — Business Connect" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PresentQrPage,
});

/** Canonical public URL the QR encodes — fully qualified, /b/<slug> only. */
export function canonicalPublicCardUrl(origin: string, slug: string): string {
  return `${origin}/b/${encodeURIComponent(slug)}`;
}

function PresentQrPage() {
  const t = useT();
  const myIdentity = useMyIdentity();
  const [cards, setCards] = useState<BusinessCardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    BusinessCardSDK.listGlobal()
      .then((list) => {
        if (!active) return;
        setCards(list);
        const primary = list.find((c) => c.cardKind === "primary") ?? list[0];
        setSelectedId(primary?.id ?? null);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : "Error"));
    return () => {
      active = false;
    };
  }, []);

  const list = cards ?? [];
  const selected = useMemo(() => list.find((c) => c.id === selectedId) ?? null, [list, selectedId]);
  const published = selected?.status === "published";
  const qrValue = selected ? canonicalPublicCardUrl(window.location.origin, selected.slug) : "";

  const identity = myIdentity.data?.identity;
  const fallbackQrValue = identity?.ownerUserId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/connect-app/network/u:${identity.ownerUserId}`
    : "";

  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.me.card.title")} />
      <section className="flex flex-1 flex-col items-center pt-8">
        {cards === null && !error ? (
          <Loader2 className="mt-16 size-6 animate-spin text-[var(--bc-mobile-muted)]" />
        ) : error ? (
          <p className="mt-16 text-[15px] text-[var(--bc-mobile-muted)]">{error}</p>
        ) : list.length === 0 ? (
          identity ? (
            <div className="mt-2 flex flex-col items-center">
              <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.presentQr.personaLabel")}
              </p>
              <p className="mt-1 text-[19px] font-semibold text-[var(--bc-mobile-text)]">
                {identity.displayName || "Hội viên ViOne"}
              </p>
              {(identity.jobTitle || identity.headline || identity.companyName) && (
                <p className="text-[14px] text-[var(--bc-mobile-muted)]">
                  {[identity.jobTitle || identity.headline, identity.companyName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-6 rounded-[28px] bg-white p-5 shadow-[var(--bc-mobile-shadow-v)]">
                <QrCanvas
                  value={fallbackQrValue}
                  size={240}
                  logoUrl={identity.avatarUrl}
                  logoScale={0.22}
                />
              </div>

              <p className="mt-5 max-w-[32ch] text-center text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.presentQr.hint")}
              </p>

              <Link
                to="/connect-app/me/edit"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] font-medium text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors"
              >
                <Edit3 className="size-4" />
                <span>Chỉnh sửa hồ sơ & danh thiếp</span>
              </Link>
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center text-center">
              <p className="text-[15px] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.presentQr.empty")}
              </p>
              <Link
                to="/connect-app/me/edit"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bc-cta-gold px-5 text-[15px] font-semibold"
              >
                <Plus className="size-4" />
                {t("bc.mobile.presentQr.create")}
              </Link>
            </div>
          )
        ) : (
          <>
            {list.length > 1 && (
              <fieldset className="w-full max-w-[320px]">
                <legend className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.presentQr.switchPersona")}
                </legend>
                <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup">
                  {list.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={c.id === selectedId}
                      onClick={() => setSelectedId(c.id)}
                      className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition-colors ${
                        c.id === selectedId
                          ? "border-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-text)]"
                          : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
                      }`}
                    >
                      {c.cardKind === "primary" && (
                        <Star className="size-3.5 text-[var(--bc-mobile-accent)]" />
                      )}
                      {c.displayName || c.slug}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {selected && (
              <div className="mt-6 flex flex-col items-center">
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.presentQr.personaLabel")}
                </p>
                <p className="mt-1 text-[19px] font-semibold text-[var(--bc-mobile-text)]">
                  {selected.displayName || selected.slug}
                </p>
                {(selected.professionalTitle || selected.companyName) && (
                  <p className="text-[14px] text-[var(--bc-mobile-muted)]">
                    {[selected.professionalTitle, selected.companyName].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div className="mt-6 rounded-[28px] bg-white p-5 shadow-[var(--bc-mobile-shadow-v)]">
                  {published ? (
                    <QrCanvas
                      value={qrValue}
                      size={240}
                      logoUrl={selected.avatarUrl}
                      logoScale={0.22}
                    />
                  ) : (
                    <div className="grid h-[240px] w-[240px] place-items-center px-6 text-center">
                      <p className="text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
                        {t("bc.mobile.presentQr.unpublished")}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-5 max-w-[32ch] text-center text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.presentQr.hint")}
                </p>

                {published && (
                  <a
                    href={`/b/${encodeURIComponent(selected.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] font-medium text-[var(--bc-mobile-text)]"
                  >
                    <ExternalLink className="size-4" />
                    {t("bc.mobile.presentQr.viewPublic")}
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </MobilePage>
  );
}
