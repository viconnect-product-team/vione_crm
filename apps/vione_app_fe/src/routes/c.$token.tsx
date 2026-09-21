// BC-Mobile-5A/5D — /c/:token public Digital Card recipient route (ANONYMOUS).
//
// Privacy contract:
// - Renders ONLY the server-side PublicIdentityCard projection.
// - NEVER renders ownership, visibility, audit, share-link metadata, or
//   internal ids. The opaque token never appears in the UI.
// - Private-by-design share target: robots noindex,nofollow always.
// - OG metadata (5D §33): built ONLY from the PUBLIC projection — display
//   name, company, headline, avatar. An unavailable token falls back to the
//   static generic metadata, so crawlers can never tell whether a token
//   ever existed.
// - Invalid / revoked / rotated-away / disabled tokens ALL resolve to the
//   same neutral unavailable state — no directory enumeration, no oracle.

import { createFileRoute } from "@tanstack/react-router";
import { bcIdentityPublicByTokenFn } from "@/lib/business-connect/mobile/identity.functions";
import { RecipientCardView } from "@/components/business-connect/mobile/me/RecipientCardView";
import { safeWebHref } from "@/lib/business-connect/mobile/public-actions";
import type { PublicIdentityResult } from "@/lib/business-connect/mobile/identity.types";

const SITE = "https://qlhh.lovable.app";

const STATIC_META = {
  title: "Danh thiếp số — Business Connect",
  description: "Danh thiếp số được chia sẻ qua Business Connect.",
} as const;

export const Route = createFileRoute("/c/$token")({
  loader: async ({ params }): Promise<{ result: PublicIdentityResult }> => {
    try {
      return { result: await bcIdentityPublicByTokenFn({ data: params.token }) };
    } catch {
      // Malformed token (validator rejection) and any resolver failure share
      // the same neutral outcome.
      return { result: { state: "unavailable" } };
    }
  },
  head: ({ params, loaderData }) => {
    const ogUrl = `${SITE}/c/${params.token}`;
    const result = loaderData?.result;
    const card = result && result.state === "public" ? result.card : null;

    const name = card?.displayName?.trim() || "";
    const company = card?.companyName?.trim() || "";
    const title = card
      ? name && company
        ? `${name} · ${company} — Business Connect`
        : `${name || "Danh thiếp số"} — Business Connect`
      : STATIC_META.title;
    const description = card?.headline?.trim() || STATIC_META.description;
    const ogImage = card?.avatarUrl ? safeWebHref(card.avatarUrl) : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: card ? "profile" : "website" },
        { property: "og:url", content: ogUrl },
        { name: "twitter:card", content: "summary" },
        ...(ogImage && ogImage.startsWith("https://")
          ? [
              { property: "og:image", content: ogImage },
              { name: "twitter:image", content: ogImage },
            ]
          : []),
        // Private-by-design share target: never indexed.
        { name: "robots", content: "noindex, nofollow" },
      ],
      links: [{ rel: "canonical", href: ogUrl }],
    };
  },
  pendingComponent: PublicCardPending,
  component: PublicIdentityPage,
});

/** Calm skeleton while the projection resolves — no spinners. */
function PublicCardPending() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div
        aria-busy="true"
        className="overflow-hidden rounded-3xl border border-[var(--bc-mobile-border,var(--border))] bg-[var(--bc-mobile-surface,var(--background))]"
      >
        <div className="flex flex-col items-center px-6 pb-5 pt-8">
          <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2,var(--muted))] motion-reduce:animate-none" />
          <div className="mt-4 h-6 w-40 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2,var(--muted))] motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-52 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2,var(--muted))] motion-reduce:animate-none" />
        </div>
        <div className="px-5 pb-6">
          <div className="h-12 w-full animate-pulse rounded-full bg-[var(--bc-mobile-surface-2,var(--muted))] motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  );
}

function PublicIdentityPage() {
  const { result } = Route.useLoaderData();
  const { token } = Route.useParams();
  return <RecipientCardView result={result} publicUrl={`${SITE}/c/${token}`} token={token} />;
}
