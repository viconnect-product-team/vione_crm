import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  Users,
  BadgeCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import { getPublicCompanyFn } from "@/lib/company/company.functions";
import type { PublicCompany, PublicCompanyResult } from "@/lib/company/company.types";

const SITE = "https://qlhh.lovable.app";

export const Route = createFileRoute("/company/$slug")({
  // SSR so crawlers/social get a fully-rendered <head>. Body hydrates via
  // useServerData. Only public+active companies are resolvable (RLS).
  ssr: true,
  loader: async ({ params }): Promise<{ result: PublicCompanyResult | null }> => {
    try {
      const result = await getPublicCompanyFn({ data: { slug: params.slug } });
      return { result };
    } catch {
      return { result: null };
    }
  },
  head: ({ params, loaderData }) => {
    const res = loaderData?.result;
    if (!res || res.state !== "public") {
      return {
        meta: [
          { title: "Hồ sơ công ty — Company Profile" },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    const c = res.company;
    const title = c.industry ? `${c.name} — ${c.industry}` : c.name;
    const rawDesc = c.description?.trim() || `Hồ sơ công ty ${c.name}.`;
    const description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;
    const url = `${SITE}/company/${params.slug}`;
    const image = c.coverUrl || c.logoUrl || null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CompanyScreen,
});

function CompanyScreen() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const seeded = loaderData?.result ?? null;
  const publicFn = useServerFn(getPublicCompanyFn);
  const { data, loading, error } = useServerData<PublicCompanyResult | null>(
    () => publicFn({ data: { slug } }),
    seeded,
  );
  const result = data ?? seeded;

  return (
    <div className="vba-app min-h-[100dvh] px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        {loading && !result ? (
          <Spinner />
        ) : error && !result ? (
          <ErrorCard message={error} />
        ) : !result || result.state === "not_found" ? (
          <NotFound slug={slug} />
        ) : (
          <CompanyView company={result.company} />
        )}
      </div>
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
      <p className="text-[14px] font-semibold text-[var(--vba-text)]">Không tìm thấy công ty</p>
      <p className="text-[13px] text-[var(--vba-text-muted)]">/company/{slug}</p>
      <Link to="/landing" className="mt-4 text-[13px] font-medium text-[var(--vba-gold)] underline">
        Về trang chủ
      </Link>
    </div>
  );
}

function CompanyView({ company: c }: { company: PublicCompany }) {
  return (
    <article className="vba-card overflow-hidden">
      {c.coverUrl ? (
        <img
          src={c.coverUrl}
          alt={`Ảnh bìa của ${c.name}`}
          className="h-32 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-24 w-full bg-[var(--vba-gold-soft)]" />
      )}
      <div className="px-5 pb-6">
        <div className="-mt-8 mb-3 flex items-end gap-3">
          {c.logoUrl ? (
            <img
              src={c.logoUrl}
              alt={`Logo ${c.name}`}
              className="h-16 w-16 rounded-2xl border border-[var(--vba-border-soft)] bg-card object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
              <Building2 className="h-8 w-8" />
            </span>
          )}
        </div>

        <h1 className="flex items-center gap-2 text-[20px] font-bold text-[var(--vba-text)]">
          {c.name}
          {c.verified && (
            <BadgeCheck className="h-5 w-5 text-[var(--vba-gold)]" aria-label="Đã xác minh" />
          )}
        </h1>

        {(c.industry || c.size) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--vba-text-muted)]">
            {c.industry && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {c.industry}
              </span>
            )}
            {c.size && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {c.size}
              </span>
            )}
          </p>
        )}

        {(c.city || c.country) && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-[var(--vba-text-muted)]">
            <MapPin className="h-3.5 w-3.5" />
            {[c.city, c.country].filter(Boolean).join(", ")}
          </p>
        )}

        {c.description && (
          <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-[var(--vba-text)]">
            {c.description}
          </p>
        )}

        {c.website && (
          <a
            href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--vba-gold)] px-4 py-2 text-[13px] font-semibold text-foreground hover:opacity-90"
          >
            <Globe className="h-4 w-4" /> Truy cập website
          </a>
        )}
      </div>
    </article>
  );
}

export { CompanyView as _CompanyView };
