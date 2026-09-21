import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listPublicProfileSlugsFn } from "@/lib/business-card.functions";
import {
  buildProfileSitemapEntry,
  renderSitemapXml,
  type SitemapEntry,
} from "@/lib/business-card/seo-engine";

const BASE_URL = "https://qlhh.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Static, publicly-indexable routes.
        const staticEntries: SitemapEntry[] = [
          { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
          { loc: `${BASE_URL}/landing`, changefreq: "weekly", priority: "0.9" },
        ];

        // Every published + fully-public Business Profile.
        let profileEntries: SitemapEntry[] = [];
        try {
          const slugs = await listPublicProfileSlugsFn();
          profileEntries = slugs.map((s) =>
            buildProfileSitemapEntry(BASE_URL, s.slug, s.updatedAt),
          );
        } catch {
          profileEntries = [];
        }

        const xml = renderSitemapXml([...staticEntries, ...profileEntries]);
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
