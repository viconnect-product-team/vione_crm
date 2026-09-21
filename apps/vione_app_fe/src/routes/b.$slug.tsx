import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Search,
  Lightbulb,
  Sparkles,
  Facebook,
  Linkedin,
  Youtube,
  MessageCircle,
  Eye,
  Lock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import {
  getBusinessCardPreviewFn,
  getPublicBusinessCardFn,
  type BusinessCard,
  type PublicBusinessCardResult,
} from "@/lib/business-card.functions";
import { buildProfileHead } from "@/lib/business-card/seo-engine";
import { PublicDigitalCard } from "@/components/business-card/PublicDigitalCard";
import { SaveCardButton } from "@/components/business-card/SaveCardButton";
import { BusinessProfileRelationshipActions } from "@/components/connect/BusinessProfileRelationshipActions";
import { resolveMediaUrl } from "@/lib/api-client";

const SITE = "https://qlhh.lovable.app";

export const Route = createFileRoute("/b/$slug")({
  // SSR enabled so search engines, social platforms and AI crawlers receive a
  // fully-rendered <head> (structured data + OpenGraph/Twitter/canonical). The
  // interactive body still hydrates client-side via useServerData.
  ssr: true,
  validateSearch: (search: Record<string, unknown>): { preview?: boolean; s?: string } => ({
    preview: search.preview === true || search.preview === "1" || search.preview === "true",
    s: typeof search.s === "string" ? search.s : undefined,
  }),
  loaderDeps: ({ search }) => ({ preview: !!search.preview }),

  loader: async ({ params, deps }): Promise<{ result: PublicBusinessCardResult | null }> => {
    // Never fetch the auth-protected preview in the loader (SSR/prerender has no
    // session). Preview is resolved client-side; only public profiles are
    // server-rendered for SEO.
    if (deps.preview) return { result: null };
    try {
      const result = await getPublicBusinessCardFn({ data: { slug: params.slug } });
      return { result };
    } catch {
      return { result: null };
    }
  },
  head: ({ params, loaderData }) => {
    const res = loaderData?.result;
    if (!res || res.state !== "public") {
      // Drafts, members-only, private, preview or not-found are never indexable.
      return {
        meta: [
          { title: "Hồ sơ doanh nghiệp — Business Profile" },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    return buildProfileHead(res.card, {
      origin: SITE,
      slug: params.slug,
      indexable: true,
    });
  },
  component: BusinessCardScreen,
});

type Seo = {
  title: string;
  description: string;
  image: string | null;
  url: string;
  type: string;
};

function buildSeo(card: BusinessCard, slug: string): Seo {
  const name = card.displayName?.trim() || slug;
  const sub = card.professionalTitle?.trim() || card.companyName?.trim() || "";
  const title = sub ? `${name} — ${sub}` : name;
  const rawDesc = card.headline?.trim() || card.bio?.trim() || "";
  const description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;
  return {
    title,
    description: description || `Danh thiếp điện tử của ${name}.`,
    image: card.avatarUrl || card.coverUrl || null,
    url: `${SITE}/b/${slug}`,
    type: "profile",
  };
}

function BusinessCardScreen() {
  const { slug } = Route.useParams();
  const { preview, s } = Route.useSearch();
  return preview ? <PreviewScreen slug={slug} /> : <PublicScreen slug={slug} scanToken={s} />;
}

// ── Owner preview (auth, works on drafts) ───────────────────────────────────
function PreviewScreen({ slug }: { slug: string }) {
  const previewFn = useServerFn(getBusinessCardPreviewFn);
  const { data, loading, error } = useServerData<BusinessCard | null>(
    () => previewFn({ data: { slug } }),
    null,
  );

  return (
    <Shell>
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/m/business-cards"
          className="inline-flex items-center gap-2 rounded-lg text-[13px] font-semibold text-[var(--vba-text-muted)] hover:text-[var(--vba-text)]"
        >
          <ArrowLeft className="h-4 w-4" /> Quản lý danh thiếp
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vba-gold-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--vba-gold)]">
          <Eye className="h-3.5 w-3.5" /> Xem trước
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorCard message={error} />
      ) : !data ? (
        <NotFound slug={slug} />
      ) : (
        <>
          <SeoPanel seo={buildSeo(data, slug)} status={data.status} />
          <CardView card={data} />
        </>
      )}
    </Shell>
  );
}

// ── Public profile (no auth; respects public_mode) ──────────────────────────
// Seeded from the SSR loader so crawlers receive the real profile HTML (not a
// spinner). Falls back to a client fetch only when the loader carried no result.
function PublicScreen({ slug, scanToken }: { slug: string; scanToken?: string }) {
  const loaderData = Route.useLoaderData();
  const seeded = loaderData?.result ?? null;
  const publicFn = useServerFn(getPublicBusinessCardFn);
  const { data, loading, error } = useServerData<PublicBusinessCardResult | null>(
    () => publicFn({ data: { slug } }),
    seeded,
  );
  const result = data ?? seeded;

  // Fast-scan mode: when a `?s=<token>` param is present, validate freshness
  // and broadcast the outcome to the presenter's fast-scan modal. Fire once.
  const broadcastedRef = useRef(false);
  useEffect(() => {
    if (!scanToken || broadcastedRef.current) return;
    broadcastedRef.current = true;
    void (async () => {
      const { parseScanToken, broadcastScanEvent } = await import("@/lib/card-scan");
      const parsed = parseScanToken(scanToken);
      await broadcastScanEvent(slug, {
        ok: parsed.ok,
        token: scanToken,
        reason: parsed.ok ? undefined : parsed.bucket === null ? "malformed" : "expired",
        at: Date.now(),
      });
    })();
  }, [slug, scanToken]);

  return (
    <Shell>
      {loading && !result ? (
        <Spinner />
      ) : error && !result ? (
        <ErrorCard message={error} />
      ) : !result || result.state === "not_found" ? (
        <NotFound slug={slug} />
      ) : result.state === "members_only" ? (
        <MembersOnly slug={slug} />
      ) : (
        // BC-Mobile-3A — guests receive the whitelist DTO only, rendered by
        // the dedicated public card (safe-href actions, server-built .vcf).
        <PublicDigitalCard card={result.card} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="vba-app min-h-[100dvh] px-4 py-6">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--vba-text-dim)]" />
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="vba-card flex flex-col items-center gap-2 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-[var(--vba-danger)]" />
      <p className="text-[13px] text-[var(--vba-text-muted)]">{message}</p>
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="vba-card flex flex-col items-center gap-2 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-[var(--vba-gold)]" />
      <p className="text-[14px] font-semibold text-[var(--vba-text)]">Không tìm thấy danh thiếp</p>
      <p className="text-[13px] text-[var(--vba-text-muted)]">/b/{slug}</p>
    </div>
  );
}

function MembersOnly({ slug }: { slug: string }) {
  return (
    <div className="vba-card flex flex-col items-center gap-3 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
        <Lock className="h-6 w-6" />
      </span>
      <p className="text-[15px] font-bold text-[var(--vba-text)]">Danh thiếp dành cho hội viên</p>
      <p className="text-[13px] text-[var(--vba-text-muted)]">
        Danh thiếp này chỉ hiển thị với hội viên đã đăng nhập. Vui lòng đăng nhập để xem.
      </p>
      <Link
        to="/auth"
        search={{ redirect: `/b/${slug}` }}
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[var(--vba-gold)] px-4 py-2 text-[13px] font-semibold text-foreground hover:opacity-90"
      >
        Đăng nhập
      </Link>
    </div>
  );
}

function SeoPanel({ seo, status }: { seo: Seo; status: string }) {
  return (
    <section className="vba-card mb-4 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--vba-border-soft)] px-4 py-3">
        <Search className="h-4 w-4 text-[var(--vba-gold)]" />
        <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--vba-gold)]">
          SEO Metadata
        </span>
        {status !== "published" ? (
          <span className="ml-auto rounded-full bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vba-gold)]">
            Chưa xuất bản
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-4 text-[12px]">
        <MetaRow label="Title" value={seo.title} />
        <MetaRow label="Description" value={seo.description} />
        <MetaRow label="og:url" value={seo.url} />
        <MetaRow label="og:type" value={seo.type} />
        <MetaRow label="og:image" value={seo.image ?? "— (không có)"} />
      </div>
      <div className="border-t border-[var(--vba-border-soft)] px-4 py-3">
        <div className="text-[11px] text-[var(--vba-text-dim)]">Xem trước kết quả tìm kiếm</div>
        <div className="mt-1.5 truncate text-[13px] text-primary">{seo.url}</div>
        <div className="truncate text-[15px] font-medium text-[var(--vba-text)]">{seo.title}</div>
        <div className="line-clamp-2 text-[12px] text-[var(--vba-text-muted)]">
          {seo.description}
        </div>
      </div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 font-semibold text-[var(--vba-text-dim)]">{label}</span>
      <span className="min-w-0 flex-1 break-words text-[var(--vba-text)]">{value}</span>
    </div>
  );
}

function CardView({ card }: { card: BusinessCard }) {
  const name = card.displayName || card.slug;
  const resolvedCover = resolveMediaUrl(card.coverUrl) || card.coverUrl;
  const resolvedAvatar = resolveMediaUrl(card.avatarUrl) || card.avatarUrl;
  return (
    <article className="vba-card overflow-hidden">
      <div className="relative h-24 bg-[var(--vba-gold-soft)]">
        {resolvedCover ? (
          <img src={resolvedCover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="vba-gold-grad h-full w-full opacity-30" />
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end gap-3">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={name}
              className="h-20 w-20 rounded-2xl border-2 border-[var(--vba-bg-2)] object-cover"
              width={80}
              height={80}
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-[var(--vba-bg-2)] bg-[var(--vba-gold-soft)] text-[24px] font-bold text-[var(--vba-gold)]">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="mt-3 text-[19px] font-bold text-[var(--vba-text)]">{name}</h1>
        {card.professionalTitle ? (
          <p className="text-[13px] text-[var(--vba-text-muted)]">{card.professionalTitle}</p>
        ) : null}
        {card.companyName ? (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--vba-gold)]">
            <Building2 className="h-3.5 w-3.5" />
            {card.companyName}
          </p>
        ) : null}
        {card.headline ? (
          <p className="mt-2 text-[13px] italic text-[var(--vba-text-muted)]">“{card.headline}”</p>
        ) : null}
        {card.bio ? (
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[var(--vba-text)]">
            {card.bio}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SaveCardButton slug={card.slug} />
        </div>

        <BusinessProfileRelationshipActions cardSlug={card.slug} />

        {card.visibilitySettings.showContact && (
          <div className="mt-4 space-y-2">
            <Contact icon={Globe} value={card.website} href={card.website} />
            <Contact
              icon={Mail}
              value={card.workEmail}
              href={card.workEmail ? `mailto:${card.workEmail}` : null}
            />
            <Contact
              icon={Phone}
              value={card.workPhone}
              href={card.workPhone ? `tel:${card.workPhone}` : null}
            />
            <Contact icon={MapPin} value={card.address} href={card.mapUrl} />
          </div>
        )}

        {card.visibilitySettings.showSocial &&
          (card.zaloUrl ||
            card.linkedinUrl ||
            card.facebookUrl ||
            card.youtubeUrl ||
            card.tiktokUrl) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Social icon={MessageCircle} href={card.zaloUrl} label="Zalo" />
              <Social icon={Linkedin} href={card.linkedinUrl} label="LinkedIn" />
              <Social icon={Facebook} href={card.facebookUrl} label="Facebook" />
              <Social icon={Youtube} href={card.youtubeUrl} label="YouTube" />
              <Social icon={Sparkles} href={card.tiktokUrl} label="TikTok" />
            </div>
          )}

        {card.skills.length > 0 && (
          <Block title="Kỹ năng">
            <div className="flex flex-wrap gap-2">
              {card.skills.map((s, i) => (
                <span
                  key={`${s.label}-${i}`}
                  className="rounded-full bg-[var(--vba-gold-soft)] px-3 py-1 text-[12px] font-medium text-[var(--vba-gold)]"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </Block>
        )}

        {card.visibilitySettings.showServices && card.services.length > 0 && (
          <Block title="Dịch vụ" icon={Briefcase}>
            <ItemList items={card.services} />
          </Block>
        )}

        {card.visibilitySettings.showNeeds && card.needs.length > 0 && (
          <Block title="Nhu cầu" icon={Lightbulb}>
            <ItemList items={card.needs} />
          </Block>
        )}
      </div>
    </article>
  );
}

function Contact({
  icon: Icon,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | null;
  href: string | null;
}) {
  if (!value) return null;
  const inner = (
    <span className="inline-flex items-center gap-2.5 text-[13px] text-[var(--vba-text)]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 truncate">{value}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:opacity-80">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}

function Social({
  icon: Icon,
  href,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href: string | null;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--vba-border-soft)] text-[var(--vba-text)] hover:bg-card/5"
    >
      <Icon className="h-4.5 w-4.5" />
    </a>
  );
}

function Block({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h2 className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--vba-text)]">
        {Icon ? <Icon className="h-4 w-4 text-[var(--vba-gold)]" /> : null}
        {title}
      </h2>
      {children}
    </div>
  );
}

function ItemList({ items }: { items: { title: string; description: string | null }[] }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-[var(--vba-border-soft)] p-3">
          <div className="text-[13px] font-semibold text-[var(--vba-text)]">{it.title}</div>
          {it.description ? (
            <p className="mt-0.5 text-[12px] text-[var(--vba-text-muted)]">{it.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
