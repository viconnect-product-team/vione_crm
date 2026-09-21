import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type CardSettings = {
  displayName: string | null;
  displayCompany: string | null;
  photoUrl: string | null;
  showName: boolean;
  showCompany: boolean;
  showPhoto: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
};

const DEFAULTS: CardSettings = {
  displayName: null,
  displayCompany: null,
  photoUrl: null,
  showName: true,
  showCompany: true,
  showPhoto: true,
  showEmail: true,
  showPhone: true,
  showAddress: true,
};

export const getCardSettings = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CardSettings> => {
    try {
      const res = await fetchNestApiFromServer<CardSettings>("/business-cards/settings/me", context.token);
      return res || DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

export const saveCardSettings = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        displayName: z.string().max(120).nullable().optional(),
        displayCompany: z.string().max(160).nullable().optional(),
        photoUrl: z.string().max(400000).nullable().optional(),
        showName: z.boolean(),
        showCompany: z.boolean(),
        showPhoto: z.boolean(),
        showEmail: z.boolean().optional(),
        showPhone: z.boolean().optional(),
        showAddress: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return await fetchNestApiFromServer<{ ok: boolean }>("/business-cards/settings/me", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export type PublicCard = {
  found: boolean;
  code: string;
  name: string;
  company: string;
  type: "company" | "individual";
  status: string;
  verified: boolean;
  validUntil: string | null;
  joinedAt: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  taxCode: string | null;
  industry: string | null;
  region: string | null;
  address: string | null;
  website: string | null;
  photoUrl: string | null;
  headline?: string | null;
  bio?: string | null;
  zaloUrl?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  userId?: string | null;
  privacySettings?: {
    showPhoto: boolean;
    showName: boolean;
    showCompany: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showAddress: boolean;
  };
};

// Public endpoint: verify & display a member card by its code (QR target).
export const getPublicCard = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ code: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }): Promise<PublicCard> => {
    try {
      const res = await fetchNestApiFromServer<PublicCard>(`/business-cards/public-card/${encodeURIComponent(data.code)}`);
      return (
        res || {
          found: false,
          code: data.code,
          name: "",
          company: "",
          type: "company",
          status: "",
          verified: false,
          validUntil: null,
          joinedAt: null,
          title: null,
          email: null,
          phone: null,
          taxCode: null,
          industry: null,
          region: null,
          address: null,
          website: null,
          photoUrl: null,
        }
      );
    } catch {
      return {
        found: false,
        code: data.code,
        name: "",
        company: "",
        type: "company",
        status: "",
        verified: false,
        validUntil: null,
        joinedAt: null,
        title: null,
        email: null,
        phone: null,
        taxCode: null,
        industry: null,
        region: null,
        address: null,
        website: null,
        photoUrl: null,
      };
    }
  });
