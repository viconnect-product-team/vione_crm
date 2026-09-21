// BC-3.1E — Unified Relationship Read server-function adapter.
// Thin authenticated RPC boundary exposing the single UnifiedRelationshipView.
// Read-only: no lifecycle mutations here (those stay in the connection adapters).
//
// Client-safe module: only handler bodies ship server-side. The server-only
// read service is loaded via await import() inside the handler.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { UnifiedRelationshipView } from "./global-network/unified-relationship.types";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

const slugSchema = z.string().min(1).max(200);

export const getUnifiedRelationshipBySlugFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ cardSlug: slugSchema }).parse(input))
  .handler(async ({ data, context }): Promise<UnifiedRelationshipView> => {
    const { getUnifiedRelationshipBySlug } =
      await import("./global-network/unified-relationship.server");
    return getUnifiedRelationshipBySlug(getDb(context), context.userId, data.cardSlug);
  });
