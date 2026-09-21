import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PLATFORM_APP_HOSTS } from "@/lib/tenant";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type PublicAssociation = {
  id?: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  brandPrimary: string | null;
  tagline: string | null;
  about: string | null;
  contactEmail: string | null;
};

/** Public, unauthenticated read of an association's published landing branding. */
export const getPublicAssociationFn = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<PublicAssociation | null> => {
    try {
      const res = await fetchNestApiFromServer<any>(
        `/public/association/${encodeURIComponent(data.slug)}`
      );
      if (!res) return null;
      return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        logoUrl: res.logoUrl ?? res.logo_url ?? null,
        brandPrimary: res.brandPrimary ?? res.brand_primary ?? null,
        tagline: res.tagline ?? null,
        about: res.about ?? null,
        contactEmail: res.contactEmail ?? res.contact_email ?? null,
      };
    } catch (e) {
      console.error("Error fetching public association:", e);
      return null;
    }
  });

/** Resolve a published association by request hostname (custom domain or subdomain). */
export const resolveAssociationByHostFn = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ host: z.string().max(255).optional() }).parse(d ?? {}))
  .handler(async ({ data }): Promise<PublicAssociation | null> => {
    let host = data.host;
    if (!host) {
      try {
        const { getRequestHost } = await import("@tanstack/react-start/server");
        host = getRequestHost();
      } catch {
        /* no request context */
      }
    }
    if (!host) return null;
    host = host.split(":")[0].toLowerCase();
    // Ignore platform app/preview hosts and bad input.
    if (
      host === "localhost" ||
      host.endsWith(".lovable.app") ||
      host === "lovable.app" ||
      PLATFORM_APP_HOSTS.includes(host) ||
      /^[\d.]+$/.test(host) ||
      !/^[a-z0-9.-]+$/.test(host)
    ) {
      return null;
    }

    try {
      const res = await fetchNestApiFromServer<any>(
        `/public/association/resolve-host?host=${encodeURIComponent(host)}`
      );
      if (!res) return null;
      return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        logoUrl: res.logoUrl ?? res.logo_url ?? null,
        brandPrimary: res.brandPrimary ?? res.brand_primary ?? null,
        tagline: res.tagline ?? null,
        about: res.about ?? null,
        contactEmail: res.contactEmail ?? res.contact_email ?? null,
      };
    } catch {
      return null;
    }
  });

