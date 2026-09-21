// BC-Mobile — RPC mỏng cho showcase của chủ sở hữu (actor lấy từ auth).
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type { IdentityShowcasePayload } from "./identity-showcase.service";

export const bcIdentityShowcaseGetMineFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    ({ context }): Promise<IdentityShowcasePayload> =>
      fetchNestApiFromServer("/connect-app/me/showcase", context.token),
  );

export const bcIdentityShowcaseAddItemFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: any) => data)
  .handler(
    ({ data, context }): Promise<{ success: boolean }> =>
      fetchNestApiFromServer("/connect-app/me/showcase", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  );

export const bcIdentityShowcaseDeleteItemFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(
    ({ data, context }): Promise<{ success: boolean }> =>
      fetchNestApiFromServer(`/connect-app/me/showcase/${data.id}`, context.token, {
        method: "DELETE",
      }),
  );
