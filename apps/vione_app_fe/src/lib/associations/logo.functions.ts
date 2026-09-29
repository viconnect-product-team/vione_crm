import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer, getBaseApiUrl } from "@/lib/api-client";

export const updateAssociationLogoFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) =>
    z
      .object({
        associationId: z.string(),
        logoUrl: z.string().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    return await fetchNestApiFromServer("/communities/logo", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const uploadAssociationLogoFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => {
    if (!(d instanceof FormData)) throw new Error("INVALID_PAYLOAD");
    const associationId = String(d.get("associationId") ?? "");
    const file = d.get("file");
    if (!(file instanceof File)) throw new Error("NO_FILE");
    return { associationId, file };
  })
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    const { file, associationId } = data;
    const baseApi = getBaseApiUrl();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("associationId", associationId);

    const headers: Record<string, string> = {};
    if (context.token) {
      headers["Authorization"] = `Bearer ${context.token}`;
    }

    const res = await fetch(`${baseApi}/upload/association-logo`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || "UPLOAD_FAILED");
    }

    const json = (await res.json()) as { url: string };
    return { url: json.url };
  });

export type LogoHistoryEntry = {
  id: string;
  action: string;
  changedByName: string | null;
  oldLogoUrl: string | null;
  newLogoUrl: string | null;
  createdAt: string;
};

export const listLogoHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ associationId: z.string() }).parse(d))
  .handler(async ({ context, data }): Promise<LogoHistoryEntry[]> => {
    try {
      const res = await fetchNestApiFromServer<LogoHistoryEntry[]>(
        `/communities/logo-history?associationId=${encodeURIComponent(data.associationId)}`,
        context.token,
      );
      return res || [];
    } catch {
      return [];
    }
  });
