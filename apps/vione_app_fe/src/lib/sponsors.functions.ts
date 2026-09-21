import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export type Sponsor = {
  id: string;
  name: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  sponsorType: "regular" | "new";
  packageType: "cash" | "in_kind";
  inKindDescription?: string;
  contact: string;
  email: string;
  phone: string;
  amount: number;
  events: number;
  since: string;
  status: "active" | "expired";
};

export type SponsorPackage = {
  id: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  price: number;
  packageType: "cash" | "in_kind";
  inKindDescription?: string;
  benefits: string[];
  available: number;
  sold: number;
};

const TIER_ORDER = ["platinum", "gold", "silver", "bronze"];

export const listSponsorsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Sponsor[]> => {
    try {
      const res = await fetchNestApiFromServer<Sponsor[]>("/sponsors", context.token);
      return Array.isArray(res) ? res : [];
    } catch (err: any) {
      console.error("[listSponsorsFn] error:", err);
      return [];
    }
  });

export const listSponsorPackagesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<SponsorPackage[]> => {
    try {
      const res = await fetchNestApiFromServer<SponsorPackage[]>("/sponsors/packages", context.token);
      return Array.isArray(res)
        ? res.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
        : [];
    } catch (err: any) {
      console.error("[listSponsorPackagesFn] error:", err);
      return [];
    }
  });

const sponsorInput = z.object({
  name: z.string().min(1).max(200),
  tier: z.enum(["platinum", "gold", "silver", "bronze"]).default("bronze"),
  sponsorType: z.enum(["regular", "new"]).default("new"),
  packageType: z.enum(["cash", "in_kind"]).default("cash"),
  inKindDescription: z.string().max(1000).optional().default(""),
  contact: z.string().max(120).default(""),
  email: z.string().max(160).default(""),
  phone: z.string().max(40).default(""),
  amount: z.number().min(0).max(1e12).default(0),
  events: z.number().int().min(0).max(100000).default(0),
  since: z.string().max(40).optional().transform((v) => (v && v.trim() ? v.trim() : new Date().toISOString().slice(0, 10))),
  status: z.enum(["active", "expired"]).default("active"),
});

export const createSponsorFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => sponsorInput.parse(d))
  .handler(async ({ data, context }): Promise<Sponsor> => {
    return fetchNestApiFromServer<Sponsor>("/sponsors", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateSponsorFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => sponsorInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Sponsor> => {
    const { id, ...rest } = data;
    return fetchNestApiFromServer<Sponsor>(`/sponsors/${id}`, context.token, {
      method: "PUT",
      body: JSON.stringify(rest),
    });
  });

export const deleteSponsorFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer<{ ok: boolean }>(`/sponsors/${data.id}`, context.token, {
      method: "DELETE",
    });
  });

// ---------------- Sponsor packages CRUD ----------------

const packageInput = z.object({
  tier: z.enum(["platinum", "gold", "silver", "bronze"]),
  price: z.number().min(0).max(1e12).default(0),
  packageType: z.enum(["cash", "in_kind"]).default("cash"),
  inKindDescription: z.string().max(1000).optional().default(""),
  benefits: z.array(z.string().min(1).max(200)).max(30).default([]),
  available: z.number().int().min(0).max(100000).default(0),
  sold: z.number().int().min(0).max(100000).default(0),
});

export const createSponsorPackageFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => packageInput.parse(d))
  .handler(async ({ data, context }): Promise<SponsorPackage> => {
    return fetchNestApiFromServer<SponsorPackage>("/sponsors/packages", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateSponsorPackageFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => packageInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<SponsorPackage> => {
    const { id, ...rest } = data;
    return fetchNestApiFromServer<SponsorPackage>(`/sponsors/packages/${id}`, context.token, {
      method: "PUT",
      body: JSON.stringify(rest),
    });
  });

export const deleteSponsorPackageFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer<{ ok: boolean }>(`/sponsors/packages/${data.id}`, context.token, {
      method: "DELETE",
    });
  });

// ---------------- Sponsor onboarding ----------------

const onboardInput = z.object({
  packageId: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
  contact: z.string().max(120).default(""),
  email: z.string().max(160).default(""),
  phone: z.string().max(40).default(""),
});

export const onboardSponsorFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => onboardInput.parse(d))
  .handler(async ({ data, context }): Promise<Sponsor> => {
    return fetchNestApiFromServer<Sponsor>("/sponsors/onboard", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
