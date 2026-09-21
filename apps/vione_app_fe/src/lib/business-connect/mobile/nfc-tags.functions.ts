// BC-Mobile-5C — NFC tag registry RPC (thin wrappers only).
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import {
  nfcTagRegisterSchema,
  nfcTagRenameSchema,
  nfcTagRevokeSchema,
} from "./nfc-tags.validation";
import type { IdentityNfcTagInfo } from "./nfc-tags.types";

export const bcIdentityNfcTagsListFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    ({ context }): Promise<IdentityNfcTagInfo[]> =>
      fetchNestApiFromServer("/connect-app/me/nfc-tags", context.token),
  );

export const bcIdentityNfcTagRegisterFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => nfcTagRegisterSchema.parse(data))
  .handler(
    ({ data, context }): Promise<IdentityNfcTagInfo> =>
      fetchNestApiFromServer("/connect-app/me/nfc-tags", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  );

export const bcIdentityNfcTagRevokeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => nfcTagRevokeSchema.parse(data))
  .handler(
    ({ data, context }): Promise<IdentityNfcTagInfo> =>
      fetchNestApiFromServer(`/connect-app/me/nfc-tags/${data.tagId}`, context.token, {
        method: "DELETE",
      }),
  );

export const bcIdentityNfcTagRenameFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => nfcTagRenameSchema.parse(data))
  .handler(
    ({ data, context }): Promise<IdentityNfcTagInfo> =>
      fetchNestApiFromServer(`/connect-app/me/nfc-tags/${data.tagId}`, context.token, {
        method: "PATCH",
        body: JSON.stringify({ label: data.label }),
      }),
  );

// ── Client-side direct helpers (bypass requireSupabaseAuth middleware) ────────
import { fetchNestApi } from "../../api-client";

/** Đăng ký NFC tag trực tiếp qua JWT client. */
export async function registerNfcTagDirect(shareToken: string): Promise<IdentityNfcTagInfo> {
  return fetchNestApi<IdentityNfcTagInfo>("/connect-app/me/nfc-tags", {
    method: "POST",
    body: JSON.stringify({ shareToken }),
  });
}
