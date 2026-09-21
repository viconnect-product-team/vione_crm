// BC-Mobile — User settings server functions.
// Migrated from Supabase client to NestJS REST API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export type VotingOpenPref = "same" | "new";

export type AppSettings = {
  orgName: string;
  orgEmail: string;
  lang: "vi" | "en";
  emailNotif: boolean;
  smsNotif: boolean;
  twoFa: boolean;
};

const DEFAULTS: AppSettings = {
  orgName: "Hiệp hội Doanh nghiệp Việt Nam",
  orgEmail: "contact@vba.vn",
  lang: "vi",
  emailNotif: true,
  smsNotif: false,
  twoFa: true,
};

export const getVotingOpenPrefFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<{ pref: VotingOpenPref | null }> => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer<{ pref: VotingOpenPref | null }>(
        "/connect-app/me/voting-pref",
        token,
      );
    } catch {
      return { pref: null };
    }
  });

export const setVotingOpenPrefFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input) => z.object({ pref: z.enum(["same", "new"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { token } = context as any;
    return fetchNestApiFromServer<{ ok: true }>("/connect-app/me/voting-pref", token, {
      method: "POST",
      body: JSON.stringify({ pref: data.pref }),
    });
  });

export const clearVotingOpenPrefFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async ({ context }) => {
    const { token } = context as any;
    return fetchNestApiFromServer<{ ok: true }>("/connect-app/me/voting-pref", token, {
      method: "POST",
      body: JSON.stringify({ pref: null }),
    });
  });

export const getSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AppSettings> => {
    const { token } = context as any;
    try {
      const data = await fetchNestApiFromServer<AppSettings>("/connect-app/me/settings", token);
      return {
        orgName: data?.orgName ?? DEFAULTS.orgName,
        orgEmail: data?.orgEmail ?? DEFAULTS.orgEmail,
        lang: (data?.lang ?? DEFAULTS.lang) as "vi" | "en",
        emailNotif: data?.emailNotif ?? DEFAULTS.emailNotif,
        smsNotif: data?.smsNotif ?? DEFAULTS.smsNotif,
        twoFa: data?.twoFa ?? DEFAULTS.twoFa,
      };
    } catch {
      return DEFAULTS;
    }
  });

export const saveSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input) =>
    z
      .object({
        orgName: z.string().max(200),
        orgEmail: z.string().max(200),
        lang: z.enum(["vi", "en"]),
        emailNotif: z.boolean(),
        smsNotif: z.boolean(),
        twoFa: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { token } = context as any;
    return fetchNestApiFromServer<{ ok: true }>("/connect-app/me/settings", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
