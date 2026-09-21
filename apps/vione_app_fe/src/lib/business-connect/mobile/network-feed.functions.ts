import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";

const feedInput = z.object({
  cursor: z.string().min(4).max(40).nullish(),
  limit: z.number().int().min(1).max(30).optional(),
});

export const bcMobileNetworkFeedFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => feedInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { token } = context as any;
    const url = `/connect-app/network/feed${data.cursor ? `?cursor=${data.cursor}` : ""}`;
    return fetchNestApiFromServer(url, token);
  });

