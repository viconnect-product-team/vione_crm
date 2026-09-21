// BC-Mobile-3A — Public .vcf download endpoint: GET /api/public/card/<slug>.vcf
//
// The vCard is ALWAYS generated server-side from the canonical public
// projection (same whitelist DTO as /b/<slug>) — never from client-supplied
// fields — so page and vCard share identical privacy rules. Fails closed:
// invalid slug, unpublished, members-only, or private cards all collapse
// into the same generic 404 (no slug enumeration signal).

import { createFileRoute } from "@tanstack/react-router";
import { isValidPublicSlug } from "@/lib/business-card/public-card";
import { buildVCard, vcfFilenameForSlug, VCF_CONTENT_TYPE } from "@/lib/business-card/vcard";
import { allowPublicRequest, clientKey } from "@/lib/public-rate-limit";

// ~30 vCard downloads per minute per client identity — generous for a real
// guest, useless for a scraper.
const VCF_RATE_LIMIT = 30;
const VCF_RATE_WINDOW_MS = 60_000;

export const Route = createFileRoute("/api/public/card/{$slug}.vcf")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!allowPublicRequest(clientKey(request), VCF_RATE_LIMIT, VCF_RATE_WINDOW_MS)) {
          return new Response("Too many requests", { status: 429 });
        }

        const slug = (params.slug ?? "").replace(/\.vcf$/i, "");
        if (!isValidPublicSlug(slug)) {
          return new Response("Not found", { status: 404 });
        }

        const { BusinessCardService } = await import("@/lib/business-card/business-card.service");
        const result = await BusinessCardService.getPublicBySlug(slug);
        if (result.state !== "public") {
          // members_only / not_found → identical generic 404, no details.
          return new Response("Not found", { status: 404 });
        }

        const origin = new URL(request.url).origin;
        const body = buildVCard(result.card, origin);
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": VCF_CONTENT_TYPE,
            "Content-Disposition": `attachment; filename="${vcfFilenameForSlug(slug)}"`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
