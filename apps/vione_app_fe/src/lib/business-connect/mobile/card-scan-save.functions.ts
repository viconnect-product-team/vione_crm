// BC-Mobile-4B — duplicate resolve + canonical save RPCs (thin).
// Directs all requests to backend NestJS RESTful API.

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type {
  ScanDuplicateCandidate,
  ScanDuplicateResolution,
  ScanDuplicateState,
  ScanSaveResponse,
} from "./card-scan.review";

/** Maps raw API resolve response to the local ScanDuplicateResolution shape. */
export function mapResolveResponse(raw: unknown): ScanDuplicateResolution {
  const fallback: ScanDuplicateResolution = { state: "none", candidates: [] };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const rawState = obj.state;
  if (rawState !== "none" && rawState !== "exact" && rawState !== "ambiguous") {
    return fallback;
  }
  if (!Array.isArray(obj.candidates)) {
    return { state: rawState === "exact" ? "none" : (rawState as ScanDuplicateState), candidates: [] };
  }
  const candidates: ScanDuplicateCandidate[] = [];
  for (const c of obj.candidates) {
    if (!c || typeof c !== "object") continue;
    const item = c as Record<string, unknown>;
    if (typeof item.personId !== "string" || !/^(g|u|c):.+/.test(item.personId)) continue;
    if (item.kind !== "guest" && item.kind !== "saved_card" && item.kind !== "connection") continue;
    if (item.matchLevel !== "exact" && item.matchLevel !== "strong" && item.matchLevel !== "possible") continue;
    if (
      item.reason !== "phone" &&
      item.reason !== "email" &&
      item.reason !== "phone_email" &&
      item.reason !== "name_company" &&
      item.reason !== "name_domain" &&
      item.reason !== "name" &&
      item.reason !== "company"
    ) {
      continue;
    }
    candidates.push({
      personId: item.personId,
      kind: item.kind,
      displayName: typeof item.displayName === "string" ? item.displayName : null,
      title: typeof item.title === "string" ? item.title : null,
      companyName: typeof item.companyName === "string" ? item.companyName : null,
      matchLevel: item.matchLevel,
      reason: item.reason,
    });
  }

  let finalState: ScanDuplicateState = rawState as ScanDuplicateState;
  if (finalState === "exact" && candidates.length === 0) {
    finalState = "none";
  }

  return {
    state: finalState,
    candidates,
  };
}


const resolveInput = z.object({
  email: z.string().max(320).nullable(),
  phone: z.string().max(80).nullable(),
  displayName: z.string().max(240).nullish(),
  companyName: z.string().max(280).nullish(),
});

export const bcMobileCardScanResolveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => resolveInput.parse(data))
  .handler(async ({ data, context }): Promise<ScanDuplicateResolution> => {
    return fetchNestApiFromServer("/connect-app/card-scan/resolve", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

const FIELD_KEYS = [
  "displayName",
  "phone",
  "email",
  "companyName",
  "title",
  "website",
  "address",
] as const;

const saveInput = z.object({
  clientToken: z.string().uuid(),
  scanId: z.string().uuid(),
  displayName: z.string().max(240),
  phone: z.string().max(80).nullable(),
  email: z.string().max(320).nullable(),
  companyName: z.string().max(280).nullable(),
  title: z.string().max(240).nullable(),
  website: z.string().max(280).nullable(),
  address: z.string().max(320).nullable(),
  resolution: z.enum(["new", "update"]),
  targetPersonId: z.string().max(64).nullable(),
  confirmedNew: z.boolean().optional(),
  fieldChoices: z.record(z.enum(FIELD_KEYS), z.enum(["current", "card"])).nullish(),
});

export const bcMobileCardScanSaveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }): Promise<ScanSaveResponse> => {
    return fetchNestApiFromServer("/connect-app/card-scan/save", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
