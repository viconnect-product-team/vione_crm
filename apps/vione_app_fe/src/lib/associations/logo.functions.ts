import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export const updateAssociationLogoFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) =>
    z
      .object({
        associationId: z.string().uuid(),
        logoUrl: z.string().url().max(2000).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    // Read previous logo to record in history.
    const { data: prev } = await getDb(context)
      .from("associations")
      .select("logo_url")
      .eq("id", data.associationId)
      .maybeSingle();
    const oldUrl = (prev as any)?.logo_url ?? null;

    // RLS (associations_admin_update) ensures only association admins can update.
    const { error } = await getDb(context)
      .from("associations")
      .update({ logo_url: data.logoUrl })
      .eq("id", data.associationId);
    if (error) throw new Error(error.message);

    // Resolve actor name for transparency.
    const { data: profile } = await getDb(context)
      .from("profiles")
      .select("full_name, email")
      .eq("id", context.userId)
      .maybeSingle();
    const actorName = (profile as any)?.full_name || (profile as any)?.email || null;

    const action = !data.logoUrl ? "remove" : !oldUrl ? "set" : "change";

    await getDb(context).from("association_logo_history").insert({
      association_id: data.associationId,
      changed_by: context.userId,
      changed_by_name: actorName,
      old_logo_url: oldUrl,
      new_logo_url: data.logoUrl,
      action,
    });

    return { ok: true };
  });

// ---- Server-side validated logo upload ----
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

/** Detects an allowed image type from magic bytes / content. Returns ext or null. */
function detectImageType(bytes: Uint8Array): "png" | "jpg" | "webp" | "svg" | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";
  // JPEG: FF D8 FF
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "webp";
  // SVG: text starting with optional BOM/whitespace then "<?xml" or "<svg"
  const head = new TextDecoder().decode(bytes.slice(0, 512)).trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "svg";
  return null;
}

export const uploadAssociationLogoFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => {
    if (!(d instanceof FormData)) throw new Error("INVALID_PAYLOAD");
    const associationId = String(d.get("associationId") ?? "");
    const file = d.get("file");
    z.string().uuid().parse(associationId);
    if (!(file instanceof File)) throw new Error("NO_FILE");
    return { associationId, file };
  })
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    const { file, associationId } = data;

    // Size check.
    if (file.size > MAX_LOGO_BYTES) throw new Error("FILE_TOO_LARGE");
    if (file.size === 0) throw new Error("NO_FILE");

    // Content-based format check (don't trust client MIME).
    const buf = new Uint8Array(await file.arrayBuffer());
    const ext = detectImageType(buf);
    if (!ext) throw new Error("INVALID_FORMAT");

    const fname = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${associationId}/${fname}`;
    const contentType =
      ext === "svg" ? "image/svg+xml" : ext === "jpg" ? "image/jpeg" : `image/${ext}`;

    // RLS on storage.objects scopes writes to admins of this association folder.
    const { error } = await getDb(context).storage
      .from("association-logos")
      .upload(path, buf, { cacheControl: "31536000", upsert: false, contentType });
    if (error) throw new Error(error.message);

    const { data: signed, error: signErr } = await getDb(context).storage
      .from("association-logos")
      .createSignedUrl(path, SIGNED_TTL);
    if (signErr || !signed?.signedUrl) throw new Error(signErr?.message ?? "SIGN_FAILED");

    return { url: signed.signedUrl };
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
  .inputValidator((d) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<LogoHistoryEntry[]> => {
    const { data: rows, error } = await getDb(context)
      .from("association_logo_history")
      .select("id, action, changed_by_name, old_logo_url, new_logo_url, created_at")
      .eq("association_id", data.associationId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      action: r.action,
      changedByName: r.changed_by_name,
      oldLogoUrl: r.old_logo_url,
      newLogoUrl: r.new_logo_url,
      createdAt: r.created_at,
    }));
  });
